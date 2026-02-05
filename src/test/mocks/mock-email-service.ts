import type {
  EmailSendResult,
  IEmailService,
} from "@/server/services/emailService";

interface SentEmail {
  to: string;
  subject: string;
  text: string;
  html?: string;
  sentAt: Date;
}

export class MockEmailService implements IEmailService {
  public sentEmails: SentEmail[] = [];

  send(to: string, subject: string, text: string): Promise<EmailSendResult>;
  send(
    to: string,
    subject: string,
    text: string,
    html: string,
  ): Promise<EmailSendResult>;
  async send(
    to: string,
    subject: string,
    text: string,
    html?: string,
  ): Promise<EmailSendResult> {
    this.sentEmails.push({
      to,
      subject,
      text,
      html,
      sentAt: new Date(),
    });
    return { messageId: `mock-${Date.now()}` };
  }

  getLastEmail(): SentEmail | undefined {
    return this.sentEmails[this.sentEmails.length - 1];
  }

  getEmailsTo(email: string): SentEmail[] {
    return this.sentEmails.filter((e) => e.to === email);
  }

  getAllEmails(): SentEmail[] {
    return [...this.sentEmails];
  }

  clear(): void {
    this.sentEmails = [];
  }
}
