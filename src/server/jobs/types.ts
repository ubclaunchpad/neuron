import type { Transaction } from "@/server/db";
import type { NeuronContainer, NeuronCradle } from "@/server/api/di-container";

export type JobName = `jobs.${string}`;

export interface JobRetryOptions {
  retryLimit?: number;
  retryDelay?: number;
  retryBackoff?: boolean;
}

interface SharedJobOptions extends JobRetryOptions {
  singletonKey?: string;
  singletonSeconds?: number;
  singletonMinutes?: number;
  singletonHours?: number;
  singletonDays?: number;
  expireInSeconds?: number;
  tz?: string;
}

type OneOffJobOptions = SharedJobOptions & {
  cron?: never;
  correlationId?: never;
  startAt?: never;
  endAt?: never;
} & (
    | { runAt: Date | string; startAfter?: never }
    | { runAt?: never; startAfter?: Date | string | number }
  ) &
  (
    | {
        /** Cancel matching pending/active jobs atomically before inserting a fresh job. */
        replacePending: true;
        transaction: Transaction;
        singletonKey: string;
        idempotencyKey?: never;
      }
    | {
        replacePending?: false;
        /** Insert the job in the caller's PostgreSQL transaction. */
        transaction?: Transaction;
        /** Stable job ID, deduplicated while pg-boss retains the job. */
        idempotencyKey?: string;
      }
  );

type RecurringJobOptions = SharedJobOptions & {
  cron: string;
  // Logical identifier used to target specific schedule instances.
  correlationId?: string;
  startAt?: Date | string;
  endAt?: Date | string;
  runAt?: never;
  startAfter?: never;
  transaction?: never;
  replacePending?: never;
  idempotencyKey?: never;
};

export type RunJobOptions = OneOffJobOptions | RecurringJobOptions;

export interface WorkRegistrationOptions {
  teamSize?: number;
  teamConcurrency?: number;
  batchSize?: number;
  includeMetadata?: boolean;
}

export interface JobRuntimeContext {
  container: NeuronContainer;
  cradle: NeuronCradle;
  /** Cooperative cancellation: check immediately before an external side effect. */
  isCancelled?: () => Promise<boolean>;
}

type StartupRecurringOptions = Omit<RecurringJobOptions, "cron">;
type StartupOneOffOptions = Omit<
  OneOffJobOptions,
  "runAt" | "transaction" | "replacePending" | "tz"
> & {
  runAt?: never;
  transaction?: never;
  replacePending?: never;
  tz?: never;
};

export type StartupSchedule<TPayload extends object> =
  | {
      cron: string;
      data?: TPayload;
      options?: StartupRecurringOptions;
    }
  | {
      cron?: undefined;
      data?: TPayload;
      options?: StartupOneOffOptions;
    };

export interface RegisteredJob<
  TPayload extends object = Record<string, unknown>,
> {
  name: JobName;
  retryOpts?: JobRetryOptions;
  workOptions?: WorkRegistrationOptions;
  startup?: StartupSchedule<TPayload>;
  handler: (payload: TPayload, context: JobRuntimeContext) => Promise<void>;
}
