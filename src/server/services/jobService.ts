import { createHash } from "crypto";
import { sql, type SQL } from "drizzle-orm";
import type { Transaction } from "@/server/db";
import { asValue } from "awilix";
import { PgBoss, type Schedule, type Db as PgBossDatabase } from "pg-boss";

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
import type {
  JobRetryOptions,
  RegisteredJob,
  RunJobOptions,
} from "../jobs/types";

export interface IJobService {
  start(): Promise<void>;
  stop(): Promise<void>;
  run<TJobName extends RunnableJobName>(
    jobName: TJobName,
    data?: JobPayload<TJobName>,
    options?: RunJobOptions,
  ): Promise<string | null>;
  cancelPending(
    jobName: RunnableJobName,
    singletonKey: string,
    options: { transaction: Transaction },
  ): Promise<void>;
  unschedule(
    jobName: RunnableJobName,
    options?: { correlationId?: string },
  ): Promise<void>;
  cancelJob(jobName: RunnableJobName, jobId: string): Promise<void>;
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
const sharedBossState: SharedBossState = globalWithBoss.__neuronPgBossState ?? {
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

  async cancelPending(
    jobName: RunnableJobName,
    singletonKey: string,
    { transaction }: { transaction: Transaction },
  ): Promise<void> {
    this.getJobDefinition(jobName);
    const db = transaction ? this.transactionDb(transaction) : undefined;
    await this.cancelMatchingJobs(jobName, singletonKey, db);
  }

  private async lockJobKey(
    jobName: RunnableJobName,
    key: string,
    db: PgBossDatabase,
  ): Promise<void> {
    // Serialize transactional keyed producers until commit, including enqueue vs. cancel.
    // Job transitions and storage remain entirely owned by pg-boss.
    await db.executeSql(
      "SELECT pg_advisory_xact_lock(hashtextextended($1, 0))",
      [JSON.stringify(["neuron.jobs", jobName, key])],
    );
  }

  private async cancelMatchingJobs(
    jobName: RunnableJobName,
    key: string | undefined,
    db: PgBossDatabase | undefined,
  ): Promise<void> {
    if (!db || !key?.trim())
      throw new Error("Cancellation requires a transaction and singletonKey");
    await this.start();
    await this.lockJobKey(jobName, key, db);
    for (let attempt = 0; attempt <= 3; attempt++) {
      const jobs = await this.boss.findJobs(jobName, { key, db });
      const ids = jobs
        .filter(
          (job) =>
            job.state === "created" ||
            job.state === "retry" ||
            job.state === "active",
        )
        .map((job) => job.id);
      if (ids.length === 0) return;
      if (attempt === 3)
        throw new Error(
          "Pending jobs changed during cancellation; retry transaction",
        );
      const result = await this.boss.cancel(jobName, ids, { db });
      if ("affected" in result && result.affected === ids.length) return;
      // Native retries delete/reinsert rows. A cancel waiting on that delete
      // can miss the replacement tuple, so re-read with a fresh snapshot.
    }
  }

  private transactionDb(transaction: Transaction): PgBossDatabase {
    return {
      executeSql: async (text, values = []) => {
        // pg-boss supplies parameterized SQL. Bind each $n through Drizzle's
        // public SQL API; never interpolate values or access ORM internals.
        const chunks: SQL[] = [];
        let offset = 0;
        for (const match of text.matchAll(/\$(\d+)/g)) {
          chunks.push(sql.raw(text.slice(offset, match.index)));
          const index = Number(match[1]) - 1;
          if (index < 0 || index >= values.length)
            throw new Error("Invalid pg-boss SQL parameter");
          chunks.push(sql`${sql.param(values[index])}`);
          offset = match.index! + match[0].length;
        }
        chunks.push(sql.raw(text.slice(offset)));
        const rows = await transaction.execute(sql.join(chunks, sql.raw("")));
        // postgres-js returns a flat RowList, not node-postgres's { rows } shape.
        return { rows: Array.from(rows) };
      },
    };
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
      .filter(
        (result): result is PromiseRejectedResult =>
          result.status === "rejected",
      )
      .map((result) => result.reason);

    if (errors.length === 1) throw errors[0];
    if (errors.length > 1) {
      throw new AggregateError(
        errors,
        `${errors.length} unschedule calls failed`,
      );
    }

    sharedBossState.recurringQueuesByJob.delete(jobName);
  }

  async cancelJob(jobName: RunnableJobName, jobId: string): Promise<void> {
    this.getJobDefinition(jobName);
    await this.start();
    await this.boss.cancel(jobName, jobId);
  }

  private async runWithStartedBoss<TJobName extends KnownJobName>(
    jobName: TJobName,
    data?: JobPayload<TJobName>,
    options?: RunJobOptions,
  ): Promise<string | null> {
    const definition = this.getJobDefinition(jobName);
    const mergedOptions = mergeRetryOptions(definition.retryOpts, options);
    if (mergedOptions?.cron !== undefined) {
      const { cron, correlationId, ...scheduleOptions } = mergedOptions;
      const queueName = this.getQueueName(jobName, correlationId);

      await this.ensureWorkerRegistered(queueName, definition);

      await this.boss.schedule(
        queueName,
        cron,
        (data ?? null) as object | null,
        scheduleOptions,
      );
      this.trackRecurringQueue(jobName, queueName);
      return null;
    }

    const {
      transaction,
      replacePending,
      idempotencyKey,
      runAt,
      startAfter = runAt,
      ...queueOptions
    } = mergedOptions ?? {};
    const db = transaction ? this.transactionDb(transaction) : undefined;
    if (replacePending)
      await this.cancelMatchingJobs(jobName, queueOptions.singletonKey, db);
    else if (db && queueOptions.singletonKey !== undefined)
      await this.lockJobKey(jobName, queueOptions.singletonKey, db);
    const digest =
      idempotencyKey !== undefined
        ? createHash("sha256")
            .update(`${jobName}:${idempotencyKey}`)
            .digest("hex")
            .slice(0, 32)
        : undefined;
    const id = digest
      ? `${digest.slice(0, 8)}-${digest.slice(8, 12)}-${digest.slice(12, 16)}-${digest.slice(16, 20)}-${digest.slice(20)}`
      : undefined;
    return this.boss.send(jobName, (data ?? null) as object | null, {
      ...queueOptions,
      ...(db ? { db } : {}),
      ...(id ? { id } : {}),
      ...(startAfter !== undefined ? { startAfter } : {}),
    });
  }

  private async bootstrap(): Promise<void> {
    if (sharedBossState.isStarted) return;

    // Capture the boss instance locally and sync this.boss so that all
    // instance methods (work, send, getSchedules, etc.) use the new instance
    // after a stop() -> start() cycle. Without this, this.boss still refers
    // to the stopped instance created in the constructor.
    const boss = this.getOrCreateBoss();
    this.boss = boss;
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
      const options: RunJobOptions =
        startup.cron !== undefined
          ? { ...startup.options, cron: startup.cron }
          : (startup.options ?? {});
      await this.runWithStartedBoss(
        definition.name as KnownJobName,
        startup.data,
        options,
      );
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
        this.trackRecurringQueue(definition.name as KnownJobName, queueName);
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
    return `${jobName}/${normalized}`;
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
      if (await this.boss.getQueue(queueName)) {
        await this.boss.updateQueue(queueName, {
          ...definition.retryOpts,
        });
      } else {
        await this.boss.createQueue(queueName, {
          ...definition.retryOpts,
        });
      }

      const worker = async (job: any) => {
        const jobItems = Array.isArray(job) ? job : [job];

        for (const jobItem of jobItems) {
          const scope = this.container.createScope();
          scope.register({
            headers: asValue(new Headers()),
            session: asValue(undefined),
          });

          try {
            await definition.handler(
              definitionPayload(definition, jobItem?.data),
              {
                container: scope,
                cradle: scope.cradle,
                isCancelled: async () => {
                  const [current] = await this.boss.findJobs(queueName, {
                    id: jobItem.id,
                  });
                  return !current || current.state !== "active";
                },
              },
            );
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

    sharedBossState.pendingWorkerRegistrations.set(
      queueName,
      registrationPromise,
    );
    try {
      await registrationPromise;
    } finally {
      sharedBossState.pendingWorkerRegistrations.delete(queueName);
    }
  }

  private getOrCreateBoss(): PgBoss {
    sharedBossState.boss ??= new PgBoss({
      connectionString: this.env.DATABASE_URL,
      schema: "pgboss",
      migrate: true,
    });
    return sharedBossState.boss;
  }

  private async getSchedules(): Promise<Schedule[]> {
    return this.boss.getSchedules();
  }

  private trackRecurringQueue(jobName: KnownJobName, queueName: string): void {
    const queues =
      sharedBossState.recurringQueuesByJob.get(jobName) ?? new Set();
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
    ...Object.fromEntries(
      Object.entries(options ?? {}).filter(([, value]) => value !== undefined),
    ),
  } as TOptions;
}

function definitionPayload<TPayload>(
  _definition: { name: KnownJobName },
  payload: unknown,
): TPayload {
  return payload as TPayload;
}
