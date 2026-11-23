import { z } from "zod";
import { classifyEmailFailure } from "@/server/services/emailService";
import type { DeliveryDefinition, RegisteredJob } from "../types";

export interface SendEmailPayload {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export const sendEmailJob: RegisteredJob<SendEmailPayload> = {
  name: "jobs.send-email",
  retryOpts: {
    retryLimit: 3,
    retryDelay: 30,
    retryBackoff: true,
  },
  handler: async (payload, { cradle }) => {
    const { emailService } = cradle;
    if (payload.html) {
      await emailService.send(
        payload.to,
        payload.subject,
        payload.text,
        payload.html,
      );
    } else {
      await emailService.send(payload.to, payload.subject, payload.text);
    }
  },
};

export const sendEmailDelivery = {
  name: "jobs.send-email",
  payloadSchema: z.object({
    to: z.string(),
    subject: z.string(),
    text: z.string(),
    html: z.string().optional(),
  }),
  async prepare(payload, _tx, context) {
    return () => sendEmailJob.handler(payload, context);
  },
  classifyFailure: classifyEmailFailure,
} as const satisfies DeliveryDefinition<SendEmailPayload>;
