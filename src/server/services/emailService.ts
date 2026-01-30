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

  constructor(env: typeof environment) {
    this.env = env;
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: false,
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
