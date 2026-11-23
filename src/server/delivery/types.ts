import type { Transaction } from "@/server/db";
import type { SendEmailPayload } from "@/server/jobs/definitions/send-email.job";

export interface DeliveryPayloads {
  email: SendEmailPayload;
}

export interface DeliveryOptions {
  /** Commit delivery intent with the caller's application changes. */
  transaction: Transaction;
  idempotencyKey?: string;
  /** Supersede an undelivered revision for this key. */
  replacePending?: boolean;
}
