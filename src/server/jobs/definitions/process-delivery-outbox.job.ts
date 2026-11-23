import type { RegisteredJob } from "../types";

export const processDeliveryOutboxJob: RegisteredJob<Record<string, never>> = {
  name: "jobs.process-delivery-outbox",
  startup: {
    cron: "* * * * *",
    data: {},
    options: { singletonKey: "delivery-outbox", expireInSeconds: 120 },
  },
  queuePolicy: "singleton",
  retryOpts: { retryLimit: 3, retryDelay: 30, retryBackoff: true },
  handler: async (_payload, context) => {
    await context.cradle.jobService.processDeliveryOutbox(context);
  },
};
