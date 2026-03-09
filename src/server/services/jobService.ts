import { asValue } from "awilix";
import { PgBoss, type Schedule } from "pg-boss";

import type { env as environment } from "@/env";
import type { NeuronContainer } from "@/server/api/di-container";
import {
  isKnownJobName,
  isRegisteredJobName,
  jobsByName,
  registeredJobs,
  type JobPayload,
  type KnownJobName,
  type RunnableJobName,
} from "../jobs/registry";
import type { JobRetryOptions, RegisteredJob, RunJobOptions } from "../jobs/types";

export interface IJobService {
  start(): Promise<void>;
  stop(): Promise<void>;
  run<TJobName extends RunnableJobName>(
    jobName: TJobName,
    data?: JobPayload<TJobName>,
    options?: RunJobOptions,
  ): Promise<string | null>;
  unschedule(
    jobName: RunnableJobName,
    options?: { correlationId?: string },
  ): Promise<void>;
}

type SharedBossState = {
  boss?: PgBoss;
  isStarted: boolean;
  isWorkersRegistered: boolean;
  registeredWorkerQueues: Set<string>;
  pendingWorkerRegistrations: Map<string, Promise<void>>;
  recurringQueuesByJob: Map<KnownJobName, Set<string>>;
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
    pendingWorkerRegistrations: new Map<string, Promise<void>>(),
    recurringQueuesByJob: new Map<KnownJobName, Set<string>>(),
  };

globalWithBoss.__neuronPgBossState = sharedBossState;
sharedBossState.registeredWorkerQueues ??= new Set<string>();
sharedBossState.pendingWorkerRegistrations ??= new Map<string, Promise<void>>();
sharedBossState.recurringQueuesByJob ??= new Map<KnownJobName, Set<string>>();

export class JobService implements IJobService {
  private readonly container: NeuronContainer;
  private readonly env: typeof environment;
  private boss: PgBoss;

  constructor({
    container,
    env,
  }: {
    container: NeuronContainer;
    env: typeof environment;
  }) {
    this.container = container;
    this.env = env;
    this.boss = this.getOrCreateBoss();
  }

  async start(): Promise<void> {
    if (this.env.NODE_ENV === "test") return;
    if (sharedBossState.isStarted) return;

    sharedBossState.startPromise ??= this.bootstrap().catch((error) => {
      sharedBossState.startPromise = undefined;
      throw error;
    });
    return sharedBossState.startPromise;
  }

  async stop(): Promise<void> {
    try {
      if (sharedBossState.boss && sharedBossState.isStarted) {
        await this.boss.stop();
      }
    } finally {
      sharedBossState.boss = undefined;
      sharedBossState.isStarted = false;
      sharedBossState.isWorkersRegistered = false;
      sharedBossState.registeredWorkerQueues.clear();
      sharedBossState.pendingWorkerRegistrations.clear();
      sharedBossState.recurringQueuesByJob.clear();
      sharedBossState.startPromise = undefined;
    }
  }

  async run<TJobName extends RunnableJobName>(
    jobName: TJobName,
    data?: JobPayload<TJobName>,
    options?: RunJobOptions,
  ): Promise<string | null> {
    await this.start();
    return this.runWithStartedBoss(jobName, data, options);
  }

  async unschedule(
    jobName: RunnableJobName,
    options?: { correlationId?: string },
  ): Promise<void> {
    this.getJobDefinition(jobName);
    await this.start();

    const correlationId = options?.correlationId;
    if (correlationId) {
      const queueName = this.getQueueName(jobName, correlationId);
      await this.boss.unschedule(queueName);
      this.removeRecurringQueue(jobName, queueName);
      return;
    }

    const trackedQueues = sharedBossState.recurringQueuesByJob.get(jobName);
    const schedules = await this.getSchedules();
    const discoveredQueueNames = schedules
      .map((schedule) => schedule.name)
      .filter((name) => name === jobName || name.startsWith(`${jobName}:`));
    const queueNames = new Set<string>([
      jobName,
      ...(trackedQueues ?? []),
      ...discoveredQueueNames,
    ]);

    const results = await Promise.allSettled(
      [...queueNames].map(async (queueName) => this.boss.unschedule(queueName)),
    );
    const errors = results
      .filter((result): result is PromiseRejectedResult => result.status === "rejected")
      .map((result) => result.reason);

    if (errors.length === 1) throw errors[0];
    if (errors.length > 1) {
      throw new AggregateError(errors, `${errors.length} unschedule calls failed`);
    }

    sharedBossState.recurringQueuesByJob.delete(jobName);
  }

  private async runWithStartedBoss<TJobName extends KnownJobName>(
    jobName: TJobName,
    data?: JobPayload<TJobName>,
    options?: RunJobOptions,
  ): Promise<string | null> {
    const definition = this.getJobDefinition(jobName);
    const mergedOptions = mergeRetryOptions(definition.retries, options);
    const cron = mergedOptions?.cron;

    if (cron) {
      const correlationId = mergedOptions?.correlationId;
      const queueName = this.getQueueName(jobName, correlationId);

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
      this.trackRecurringQueue(jobName, queueName);
      return null;
    }

    if (mergedOptions?.correlationId) {
      throw new Error("correlationId is only supported for recurring (cron) runs.");
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
            startAfter: rawStartAfter,
            ...rest
          } = mergedOptions;
          if (runAt !== undefined && rawStartAfter !== undefined) {
            throw new Error("Provide either runAt or startAfter, not both.");
          }
          const startAfter = runAt ?? rawStartAfter;
          return {
            ...rest,
            ...(startAfter !== undefined ? { startAfter } : {}),
          };
        })()
      : undefined;

    return this.boss.send(jobName, (data ?? null) as object | null, sendOptions as any);
  }

  private async bootstrap(): Promise<void> {
    if (sharedBossState.isStarted) return;

    // Capture the boss instance locally so that error recovery uses the same
    // reference even if sharedBossState.boss is cleared between lines.
    const boss = this.getOrCreateBoss();
    await boss.start();
    sharedBossState.isStarted = true;

    try {
      if (!sharedBossState.isWorkersRegistered) {
        await this.registerWorkers();
        await this.registerWorkersForPersistedCorrelationSchedules();
        sharedBossState.isWorkersRegistered = true;
      }
      await this.registerStartupSchedules();
    } catch (error) {
      sharedBossState.isStarted = false;
      sharedBossState.isWorkersRegistered = false;
      sharedBossState.registeredWorkerQueues.clear();
      sharedBossState.pendingWorkerRegistrations.clear();
      sharedBossState.recurringQueuesByJob.clear();
      sharedBossState.boss = undefined;

      try {
        // Use the locally captured reference — sharedBossState.boss is already
        // cleared above and this.boss may have been reassigned.
        await boss.stop();
      } catch {
        // Ignore shutdown failures while handling bootstrap failures.
      }

      throw error;
    }
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
      await this.runWithStartedBoss(definition.name as KnownJobName, startup.data, {
        ...(startup.options ?? {}),
        cron: startup.cron,
      });
    }
  }

  private async registerWorkersForPersistedCorrelationSchedules(): Promise<void> {
    const schedules = await this.getSchedules();

    for (const definition of registeredJobs) {
      const correlatedQueueNames = schedules
        .map((schedule) => schedule.name)
        .filter(
          (queueName) =>
            queueName !== definition.name &&
            queueName.startsWith(`${definition.name}:`),
        );

      for (const queueName of correlatedQueueNames) {
        await this.ensureWorkerRegistered(queueName, definition);
        this.trackRecurringQueue(definition.name, queueName);
      }
    }
  }

  private getJobDefinition(jobName: string) {
    if (!isKnownJobName(jobName)) {
      throw new Error(`Unknown job name: ${jobName}`);
    }
    if (!isRegisteredJobName(jobName)) {
      throw new Error(
        `Job is not registered in ${this.env.NODE_ENV}: ${jobName}`,
      );
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

    const existingRegistration =
      sharedBossState.pendingWorkerRegistrations.get(queueName);
    if (existingRegistration) {
      await existingRegistration;
      return;
    }

    const registrationPromise = (async () => {
      const worker = async (job: any) => {
        const jobItems = Array.isArray(job) ? job : [job];

        for (const jobItem of jobItems) {
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
            await scope.dispose().catch((disposeError) => {
              console.error(
                `[pg-boss] scope disposal failed for job ${queueName}`,
                disposeError,
              );
            });
          }
        }
      };

      if (definition.workOptions) {
        await this.boss.work(queueName, definition.workOptions as any, worker);
      } else {
        await this.boss.work(queueName, worker);
      }

      sharedBossState.registeredWorkerQueues.add(queueName);
    })();

    sharedBossState.pendingWorkerRegistrations.set(queueName, registrationPromise);
    try {
      await registrationPromise;
    } finally {
      sharedBossState.pendingWorkerRegistrations.delete(queueName);
    }
  }

  private getOrCreateBoss(): PgBoss {
    sharedBossState.boss ??= new PgBoss({
      connectionString: this.env.DATABASE_URL,
    });
    return sharedBossState.boss;
  }

  private async getSchedules(): Promise<Schedule[]> {
    return this.boss.getSchedules();
  }

  private trackRecurringQueue(jobName: KnownJobName, queueName: string): void {
    const queues = sharedBossState.recurringQueuesByJob.get(jobName) ?? new Set();
    queues.add(queueName);
    sharedBossState.recurringQueuesByJob.set(jobName, queues);
  }

  private removeRecurringQueue(jobName: KnownJobName, queueName: string): void {
    const queues = sharedBossState.recurringQueuesByJob.get(jobName);
    if (!queues) return;
    queues.delete(queueName);
    if (queues.size === 0) {
      sharedBossState.recurringQueuesByJob.delete(jobName);
    }
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
