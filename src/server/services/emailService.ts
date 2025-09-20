import { type env as environment } from "@/env";
import nodemailer, { type Transporter } from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

type SentMessageInfo = SMTPTransport.SentMessageInfo;

export class EmailService {
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

  send(to: string, subject: string, text: string): Promise<SentMessageInfo>;
  send(
    to: string,
    subject: string,
    text: string,
    html: string,
  ): Promise<SentMessageInfo>;
  send(
    to: string,
    subject: string,
    text: string,
    html?: string,
  ): Promise<SentMessageInfo> {
    return this.transporter.sendMail({
      from: this.env.MAIL_FROM,
      to,
      subject,
      text,
      html: html ?? text,
    });
  }
}
