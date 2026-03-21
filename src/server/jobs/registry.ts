import { cleanupOrphanedImagesJob } from "./definitions/cleanup-orphaned-images.job";
import { processNotificationJob } from "./definitions/process-notification.job";
import { checkShiftNotificationsJob } from "./definitions/check-shift-notifications.job";
import type { RegisteredJob } from "./types";

const allJobs = [
  cleanupOrphanedImagesJob,
  processNotificationJob,
  checkShiftNotificationsJob,
] as const satisfies readonly RegisteredJob<any>[];

type AnyKnownJob = (typeof allJobs)[number];

export type KnownJobName = AnyKnownJob["name"];
export type RunnableJobName = KnownJobName;

type JobPayloadMap = {
  [TJob in AnyKnownJob as TJob["name"]]: TJob extends RegisteredJob<
    infer TPayload
  >
    ? TPayload
    : never;
};

export type JobPayload<TJobName extends KnownJobName> = JobPayloadMap[TJobName];

const assertUniqueJobNames = (jobs: readonly RegisteredJob<any>[]) => {
  const seen = new Set<string>();
  for (const job of jobs) {
    if (seen.has(job.name)) {
      throw new Error(`Duplicate job registration found for: ${job.name}`);
    }
    seen.add(job.name);
  }
};

assertUniqueJobNames(allJobs);

export const jobsByName = new Map<KnownJobName, AnyKnownJob>(
  allJobs.map((job) => [job.name, job] as const),
);

const knownJobNames = new Set<string>(allJobs.map((job) => job.name));

export const isKnownJobName = (jobName: string): jobName is KnownJobName =>
  knownJobNames.has(jobName);

export const registeredJobs: readonly RegisteredJob<any>[] = allJobs;

const registeredJobNames = new Set<string>(
  registeredJobs.map((job) => job.name),
);

export const isRegisteredJobName = (jobName: string): jobName is KnownJobName =>
  registeredJobNames.has(jobName);
