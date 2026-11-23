import { z } from "zod";
import type { DeliveryHandler } from "./outbox";

const emailPayload = z.object({
  to: z.string(),
  subject: z.string(),
  text: z.string(),
  html: z.string().optional(),
});

export const deliveryHandlers: Record<string, DeliveryHandler> = {
  email: {
    async prepare(intent, _tx, cradle) {
      const payload = emailPayload.parse(intent.payload);
      return async () => {
        await cradle.emailService.send(
          payload.to,
          payload.subject,
          payload.text,
          payload.html ?? payload.text,
        );
      };
    },
  },
};
