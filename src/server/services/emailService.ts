import type { DeliveryFailure } from "@/server/jobs/types";
import { type env as environment } from "@/env";
import nodemailer, { type Transporter } from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

type SentMessageInfo = SMTPTransport.SentMessageInfo;
export type EmailSendResult = Pick<SentMessageInfo, "messageId"> &
  Partial<Omit<SentMessageInfo, "messageId">>;

export interface IEmailService {
  send(to: string, subject: string, text: string): Promise<EmailSendResult>;
  send(
    to: string,
    subject: string,
    text: string,
    html: string,
  ): Promise<EmailSendResult>;
}

export class EmailService implements IEmailService {
  private readonly transporter: Transporter;
  private readonly env: typeof environment;

  constructor({ env }: { env: typeof environment }) {
    this.env = env;
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: false,
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 30_000,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }

  send(to: string, subject: string, text: string): Promise<EmailSendResult>;
  send(
    to: string,
    subject: string,
    text: string,
    html: string,
  ): Promise<EmailSendResult>;
  send(
    to: string,
    subject: string,
    text: string,
    html?: string,
  ): Promise<EmailSendResult> {
    return this.transporter.sendMail({
      from: this.env.MAIL_FROM,
      to,
      subject,
      text,
      html: html ?? text,
    });
  }
}

export function classifyEmailFailure(error: unknown): DeliveryFailure {
  const responseCode =
    typeof error === "object" && error !== null && "responseCode" in error
      ? error.responseCode
      : undefined;
  if (
    typeof responseCode === "number" &&
    Number.isInteger(responseCode) &&
    responseCode >= 400 &&
    responseCode <= 599
  ) {
    return { code: `SMTP_${responseCode}`, permanent: responseCode >= 500 };
  }
  const transportCode =
    typeof error === "object" && error !== null && "code" in error
      ? error.code
      : undefined;
  if (
    typeof transportCode === "string" &&
    [
      "ETIMEDOUT",
      "ECONNREFUSED",
      "ECONNRESET",
      "ECONNECTION",
      "ESOCKET",
      "EDNS",
      "EPIPE",
      "EAUTH",
      "ETLS",
      "EENVELOPE",
      "EMESSAGE",
    ].includes(transportCode)
  ) {
    return { code: transportCode, permanent: false };
  }
  return { code: "DELIVERY_FAILED", permanent: false };
}
