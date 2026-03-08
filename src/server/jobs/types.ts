import type { NeuronContainer, NeuronCradle } from "@/server/api/di-container";

export type JobName = `jobs.${string}`;

export interface JobRetryOptions {
  retryLimit?: number;
  retryDelay?: number;
  retryBackoff?: boolean;
}

export interface RunJobOptions extends JobRetryOptions {
  // Logical identifier used to target specific schedule instances.
  correlationId?: string;

  // One-off scheduling
  runAt?: Date | string;
  startAfter?: Date | string | number;

  // Recurring scheduling
  cron?: string;
  startAt?: Date | string;
  endAt?: Date | string;
  tz?: string;

  // Shared queue/schedule options
  singletonKey?: string;
  singletonSeconds?: number;
  singletonMinutes?: number;
  singletonHours?: number;
  singletonDays?: number;
  expireInSeconds?: number;
}

export interface WorkRegistrationOptions {
  teamSize?: number;
  teamConcurrency?: number;
  batchSize?: number;
  includeMetadata?: boolean;
}

export interface JobRuntimeContext {
  container: NeuronContainer;
  cradle: NeuronCradle;
}

type StartupRecurringOptions = Omit<RunJobOptions, "cron" | "runAt" | "startAfter">;
type StartupOneOffOptions = Omit<
  RunJobOptions,
  "cron" | "runAt" | "correlationId" | "startAt" | "endAt" | "tz"
>;

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

export interface RegisteredJob<TPayload extends object = Record<string, unknown>> {
  name: JobName;
  retries?: JobRetryOptions;
  workOptions?: WorkRegistrationOptions;
  startup?: StartupSchedule<TPayload>;
  handler: (payload: TPayload, context: JobRuntimeContext) => Promise<void>;
}
