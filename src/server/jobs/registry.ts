import { cleanupOrphanedImagesJob } from "./definitions/cleanup-orphaned-images.job";
import { scheduledTestJob } from "./definitions/scheduled-test.job";
import type { RegisteredJob } from "./types";

export const registeredJobs = [
  cleanupOrphanedImagesJob,
  scheduledTestJob,
] as const satisfies readonly RegisteredJob<any>[];

type RegisteredJobs = typeof registeredJobs;
type AnyRegisteredJob = RegisteredJobs[number];

export type KnownJobName = AnyRegisteredJob["name"];

type JobPayloadMap = {
  [TJob in AnyRegisteredJob as TJob["name"]]: TJob extends RegisteredJob<
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

assertUniqueJobNames(registeredJobs);

export const jobsByName = new Map<KnownJobName, AnyRegisteredJob>(
  registeredJobs.map((job) => [job.name, job] as const),
);

const knownJobNames = new Set<string>(registeredJobs.map((job) => job.name));

export const isKnownJobName = (jobName: string): jobName is KnownJobName =>
  knownJobNames.has(jobName);
