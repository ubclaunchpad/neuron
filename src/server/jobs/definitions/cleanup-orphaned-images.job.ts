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
  handler: async (payload) => {
    void payload;
    throw new Error("cleanup-orphaned-images handler is not implemented yet.");
  },
  };





