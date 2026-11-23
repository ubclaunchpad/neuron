import { drainDeliveries } from "@/server/delivery/outbox";
import { deliveryHandlers } from "@/server/delivery/handlers";
import type { RegisteredJob } from "../types";

export const processDeliveryOutboxJob: RegisteredJob<Record<string, never>> = {
  name: "jobs.process-delivery-outbox",
  startup: { cron: "* * * * *", data: {} },
  retryOpts: { retryLimit: 3, retryDelay: 30, retryBackoff: true },
  handler: async (_payload, { cradle }) => {
    await drainDeliveries(cradle, deliveryHandlers);
  },
};
