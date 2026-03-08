import { asValue } from "awilix";
import { PgBoss } from "pg-boss";

import type { env as environment } from "@/env";
import type { NeuronContainer } from "@/server/api/di-container";
import {
  isKnownJobName,
  jobsByName,
  registeredJobs,
  type JobPayload,
  type KnownJobName,
} from "../jobs/registry";
import type {
  JobRetryOptions,
  RegisteredJob,
  RunJobOptions,
} from "../jobs/types";

export interface IJobService {
  start(): Promise<void>;
  stop(): Promise<void>;
  run<TJobName extends KnownJobName>(
    jobName: TJobName,
    data?: JobPayload<TJobName>,
    options?: RunJobOptions,
  ): Promise<string | null>;
  unschedule(
    jobName: KnownJobName,
    options?: { correlationId?: string },
  ): Promise<void>;
}

type SharedBossState = {
  boss?: PgBoss;
  isStarted: boolean;
  isWorkersRegistered: boolean;
  registeredWorkerQueues: Set<string>;
  startPromise?: Promise<void>;
};

type GlobalWithBoss = typeof globalThis & {
  __neuronPgBossState?: SharedBossState;
};

const globalWithBoss = globalThis as GlobalWithBoss;
const sharedBossState: SharedBossState =
  globalWithBoss.__neuronPgBossState ?? {
    isStarted: false,
    isWorkersRegistered: false,
    registeredWorkerQueues: new Set<string>(),
  };

globalWithBoss.__neuronPgBossState = sharedBossState;

export class JobService implements IJobService {
  private readonly container: NeuronContainer;
  private readonly env: typeof environment;
  private readonly boss: PgBoss;

  constructor({
    container,
    env,
  }: {
    container: NeuronContainer;
    env: typeof environment;
  }) {
    this.container = container;
    this.env = env;

    sharedBossState.boss ??= new PgBoss({
      connectionString: env.DATABASE_URL,
    });

    this.boss = sharedBossState.boss;
  }

  async start(): Promise<void> {
    if (this.env.NODE_ENV === "test") return;

    sharedBossState.startPromise ??= this.bootstrap();
    return sharedBossState.startPromise;
  }

  async stop(): Promise<void> {
    if (!sharedBossState.isStarted) return;

    await this.boss.stop();
    sharedBossState.isStarted = false;
    sharedBossState.isWorkersRegistered = false;
    sharedBossState.registeredWorkerQueues.clear();
    sharedBossState.startPromise = undefined;
  }

  // One-off job execution
  async run<TJobName extends KnownJobName>(
    jobName: TJobName,
    data?: JobPayload<TJobName>,
    options?: RunJobOptions,
  ): Promise<string | null> {
    const definition = this.getJobDefinition(jobName);
    const mergedOptions = mergeRetryOptions(definition.retries, options);
    await this.start();
    const cron = mergedOptions?.cron;
    const correlationId = mergedOptions?.correlationId;
    const queueName = this.getQueueName(jobName, correlationId);

    if (cron) {
      if (mergedOptions?.runAt || mergedOptions?.startAfter) {
        throw new Error("Recurring runs cannot include runAt/startAfter.");
      }

      await this.ensureWorkerRegistered(queueName, definition);

      const {
        cron: _cron,
        runAt: _runAt,
        correlationId: _correlationId,
        ...scheduleOptions
      } = mergedOptions;
      await this.boss.schedule(
        queueName,
        cron,
        (data ?? null) as object | null,
        scheduleOptions as any,
      );
      return null;
    }

    if (mergedOptions?.startAt || mergedOptions?.endAt) {
      throw new Error("startAt/endAt require cron for recurring runs.");
    }

    const sendOptions = mergedOptions
      ? (() => {
          const {
            cron: _cron,
            startAt: _startAt,
            endAt: _endAt,
            correlationId: _correlationId,
            runAt,
            ...rest
          } = mergedOptions;
          return {
            ...rest,
            startAfter: runAt ?? rest.startAfter,
          };
        })()
      : undefined;

    return this.boss.send(jobName, (data ?? null) as object | null, sendOptions);
  }

  async unschedule(
    jobName: KnownJobName,
    options?: { correlationId?: string },
  ): Promise<void> {
    this.getJobDefinition(jobName);
    await this.start();
    const queueName = this.getQueueName(jobName, options?.correlationId);
    await this.boss.unschedule(queueName);
  }

  private async bootstrap(): Promise<void> {
    if (sharedBossState.isStarted) return;

    await this.boss.start();
    sharedBossState.isStarted = true;

    if (!sharedBossState.isWorkersRegistered) {
      await this.registerWorkers();
      sharedBossState.isWorkersRegistered = true;
    }

    await this.registerStartupSchedules();
  }

  private async registerWorkers(): Promise<void> {
    for (const definition of registeredJobs) {
      await this.ensureWorkerRegistered(definition.name, definition);
    }
  }

  private async registerStartupSchedules(): Promise<void> {
    for (const definition of registeredJobs) {
      const startup = definition.startup;
      if (!startup) continue;
      await this.run(definition.name, startup.data, {
        ...(startup.options ?? {}),
        cron: startup.cron,
      });
    }
  }

  private getJobDefinition(jobName: string) {
    if (!isKnownJobName(jobName)) {
      throw new Error(`Unknown job name: ${jobName}`);
    }
    return jobsByName.get(jobName)!;
  }

  private getQueueName(jobName: KnownJobName, correlationId?: string): string {
    if (!correlationId) return jobName;
    const normalized = correlationId.trim();
    if (!normalized) {
      throw new Error("correlationId must be a non-empty string.");
    }
    return `${jobName}:${normalized}`;
  }

  private async ensureWorkerRegistered(
    queueName: string,
    definition: RegisteredJob<any>,
  ): Promise<void> {
    if (sharedBossState.registeredWorkerQueues.has(queueName)) return;

    const worker = async (job: any) => {
      const jobItem = Array.isArray(job) ? job[0] : job;
      const scope = this.container.createScope();
      scope.register({
        headers: asValue(new Headers()),
        session: asValue(undefined),
      });

      try {
        await definition.handler(definitionPayload(definition, jobItem?.data), {
          container: scope,
          cradle: scope.cradle,
        });
      } catch (error) {
        console.error(
          `[pg-boss] job ${queueName} failed (id=${jobItem?.id ?? "unknown"})`,
          error,
        );
        throw error;
      } finally {
        await scope.dispose();
      }
    };

    if (definition.workOptions) {
      await this.boss.work(queueName, definition.workOptions as any, worker);
    } else {
      await this.boss.work(queueName, worker);
    }

    sharedBossState.registeredWorkerQueues.add(queueName);
  }
}

function mergeRetryOptions<TOptions extends JobRetryOptions>(
  defaults: JobRetryOptions | undefined,
  options: TOptions | undefined,
): TOptions | undefined {
  if (!defaults && !options) return undefined;
  return {
    ...(defaults ?? {}),
    ...(options ?? {}),
  } as TOptions;
}

function definitionPayload<TPayload>(
  _definition: { name: KnownJobName },
  payload: unknown,
): TPayload {
  return payload as TPayload;
}
