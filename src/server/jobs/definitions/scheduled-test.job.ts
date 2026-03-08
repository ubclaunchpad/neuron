import type { RegisteredJob } from "../types";

type ScheduledTestPayload = {
  message: string;
  requestedBy?: string;
};

export const scheduledTestJob: RegisteredJob<ScheduledTestPayload> = {
  name: "jobs.scheduled-test",
  retries: {
    retryLimit: 2,
    retryDelay: 10,
    retryBackoff: true,
  },
  startup: {
    data: {
      message: "Scheduled startup test job",
      requestedBy: "startup-bootstrap",
    },
    options: {
      // Prevent duplicate startup test jobs from being enqueued repeatedly.
      singletonKey: "scheduled-startup-test",
      singletonHours: 1,
      startAfter: 90,
    },
  },
  handler: async (payload) => {
    console.info("[pg-boss] scheduled-test job executed", payload);
  },
};





