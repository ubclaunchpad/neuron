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
    startup: {
      cron: "0 3 * * *",
      data: {
        initiatedBy: "scheduler",
        dryRun: false,
      },
    },
    handler: async (payload) => {
      console.info(
        "[pg-boss] cleanup-orphaned-images job executed",
        payload ?? {},
      );
      // Placeholder implementation for now.
      // Later, this can compare DB references against object storage keys
      // and remove unreferenced files safely.
    },
  };





