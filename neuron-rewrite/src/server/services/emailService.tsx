import { env } from "@/env";
import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: false,
    auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
    },
});

type SentMessageInfo = SMTPTransport.SentMessageInfo;

export class emailService {
    static send(to: string, subject: string, text: string): Promise<SentMessageInfo>;
    static send(to: string, subject: string, text: string, html: string): Promise<SentMessageInfo>;
    static send(to: string, subject: string, text: string, html?: string): Promise<SentMessageInfo> {
        return transporter.sendMail({
            from: env.MAIL_FROM,
            to,
            subject,
            text,
            html: html ?? text,
        });
    }
}