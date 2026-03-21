import type { Audience } from "@/server/notifications/types";
import type { RegisteredJob } from "../types";

export type ProcessNotificationPayload = {
  type: string;
  audience: Audience | Audience[];
  context: Record<string, unknown>;
  actorId?: string;
  idempotencyKey?: string;
  excludeUserIds?: string[];
};

export const processNotificationJob: RegisteredJob<ProcessNotificationPayload> =
  {
    name: "jobs.process-notification",
    retryOpts: {
      retryLimit: 3,
      retryDelay: 30,
      retryBackoff: true,
    },
    handler: async (payload, { cradle }) => {
      await cradle.notificationService.processNotification({
        type: payload.type,
        audience: payload.audience,
        context: payload.context,
        actorId: payload.actorId,
        idempotencyKey: payload.idempotencyKey,
        excludeUserIds: payload.excludeUserIds,
      });
    },
  };
