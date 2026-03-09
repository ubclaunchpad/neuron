import type { RegisteredJob } from "../types";

type CleanupOrphanedImagesPayload = {
  initiatedBy?: "scheduler" | "manual";
  dryRun?: boolean;
};

export const cleanupOrphanedImagesJob: RegisteredJob<CleanupOrphanedImagesPayload> =
  {
    name: "jobs.cleanup-orphaned-images",
    retries: {
      retryLimit: 3,
      retryDelay: 30,
      retryBackoff: true,
    },
    // Keep startup scheduling disabled until cleanup logic is implemented.
    startup: undefined,

    handler: async (_payload) => {
      // TODO: implement orphaned image cleanup logic.
      // This intentionally throws so that any manual invocation fails loudly
      // rather than silently retrying 3 times before landing in dead-letter.
      throw new Error(
        "cleanup-orphaned-images handler is not implemented yet. " +
          "Do not enqueue this job until the handler is complete.",
      );
    },
  };