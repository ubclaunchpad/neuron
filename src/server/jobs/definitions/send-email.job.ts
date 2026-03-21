import type { RegisteredJob } from "../types";

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
      await emailService.send(payload.to, payload.subject, payload.text, payload.html);
    } else {
      await emailService.send(payload.to, payload.subject, payload.text);
    }
  },
};
