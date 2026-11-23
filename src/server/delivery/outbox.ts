import { randomUUID } from "crypto";
import { and, eq, isNull, lte, sql } from "drizzle-orm";
import type { Drizzle, Transaction } from "@/server/db";
import {
  deliveryOutbox,
  type DeliveryIntent,
} from "@/server/db/schema/notification";
import type { NeuronCradle } from "@/server/api/di-container";
import type { SendEmailPayload } from "@/server/jobs/definitions/send-email.job";

/** Call with the domain transaction to commit state and delivery intent together. */
export async function recordDelivery(
  db: Drizzle | Transaction,
  intent: {
    kind: string;
    payload: object;
    key?: string;
    replace?: boolean;
  },
) {
  const values = {
    kind: intent.kind,
    payload: intent.payload as Record<string, unknown>,
    deliveryKey: intent.key ? `${intent.kind}:${intent.key}` : null,
    revisionId: randomUUID(),
    processedAt: null,
    nextAttemptAt: new Date(),
    attempts: 0,
  };
  const insert = db.insert(deliveryOutbox).values(values);
  if (intent.replace) {
    if (!intent.key) throw new Error("Replacing a delivery requires a key");
    await insert.onConflictDoUpdate({
      target: deliveryOutbox.deliveryKey,
      set: values,
    });
  } else {
    await insert.onConflictDoNothing({ target: deliveryOutbox.deliveryKey });
  }
}

export async function recordEmail(
  db: Drizzle | Transaction,
  payload: SendEmailPayload,
  key?: string,
) {
  await recordDelivery(db, { kind: "email", payload, key });
}

export interface DeliveryHandler {
  // Acquire any domain locks before the outbox lock, consistent with the writer.
  // Return null to suppress obsolete delivery; return a closure to send under lock.
  prepare(
    intent: DeliveryIntent,
    tx: Transaction,
    cradle: NeuronCradle,
  ): Promise<(() => Promise<void>) | null>;
}

export async function drainDeliveries(
  cradle: NeuronCradle,
  handlers: Record<string, DeliveryHandler>,
) {
  const pending = await cradle.db
    .select()
    .from(deliveryOutbox)
    .where(
      and(
        isNull(deliveryOutbox.processedAt),
        lte(deliveryOutbox.nextAttemptAt, new Date()),
      ),
    )
    .orderBy(deliveryOutbox.nextAttemptAt)
    .limit(100);
  for (const candidate of pending) {
    try {
      await cradle.db.transaction(async (tx) => {
        const handler = handlers[candidate.kind];
        if (!handler) throw new Error("Unknown delivery kind");
        const send = await handler.prepare(candidate, tx, cradle);
        const [current] = await tx
          .select()
          .from(deliveryOutbox)
          .where(eq(deliveryOutbox.id, candidate.id))
          .for("update");
        if (
          !current ||
          current.revisionId !== candidate.revisionId ||
          current.processedAt ||
          current.nextAttemptAt > new Date()
        )
          return;
        // SMTP acceptance and this commit cannot be atomic. A crash between them
        // can resend; concurrent workers and normal retries are serialized here.
        if (send) await send();
        // Erase rendered content (which may contain personal data) after delivery.
        await tx
          .update(deliveryOutbox)
          .set({ processedAt: new Date(), payload: {} })
          .where(eq(deliveryOutbox.id, current.id));
      });
    } catch {
      await cradle.db
        .update(deliveryOutbox)
        .set({
          attempts: sql`${deliveryOutbox.attempts} + 1`,
          nextAttemptAt: new Date(
            Date.now() +
              Math.min(3600, 30 * 2 ** Math.min(candidate.attempts, 7)) * 1000,
          ),
        })
        .where(
          and(
            eq(deliveryOutbox.id, candidate.id),
            eq(deliveryOutbox.revisionId, candidate.revisionId),
            isNull(deliveryOutbox.processedAt),
          ),
        );
      // Never include payloads, links or transport errors containing email content.
      console.error("[delivery-outbox] delivery failed", {
        id: candidate.id,
        kind: candidate.kind,
      });
    }
  }
}
