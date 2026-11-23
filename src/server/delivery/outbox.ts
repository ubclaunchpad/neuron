import { randomUUID } from "crypto";
import { and, eq, isNull, lte } from "drizzle-orm";
import type { Drizzle, Transaction } from "@/server/db";
import {
  deliveryOutbox,
  type DeliveryIntent,
} from "@/server/db/schema/notification";
import type { NeuronCradle } from "@/server/api/di-container";

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
    failedAt: null,
    lastErrorCode: null,
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

export async function cancelDelivery(
  db: Transaction,
  kind: string,
  key: string,
) {
  await db
    .update(deliveryOutbox)
    .set({ revisionId: randomUUID(), processedAt: new Date(), payload: {} })
    .where(eq(deliveryOutbox.deliveryKey, `${kind}:${key}`));
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

export const MAX_DELIVERY_ATTEMPTS = 8;

class UnknownDeliveryKind extends Error {}

function diagnose(error: unknown) {
  if (error instanceof UnknownDeliveryKind)
    return { code: "UNKNOWN_KIND", permanent: true };
  if (error instanceof Error && error.name === "ZodError")
    return { code: "INVALID_PAYLOAD", permanent: true };
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

async function recordFailure(
  tx: Transaction,
  current: DeliveryIntent,
  error: unknown,
) {
  const { code, permanent } = diagnose(error);
  const attempts = current.attempts + 1;
  const terminal = permanent || attempts >= MAX_DELIVERY_ATTEMPTS;
  await tx
    .update(deliveryOutbox)
    .set({
      attempts,
      failedAt: terminal ? new Date() : null,
      lastErrorCode: code,
      nextAttemptAt: new Date(
        Date.now() + Math.min(3600, 30 * 2 ** Math.min(attempts - 1, 7)) * 1000,
      ),
    })
    .where(eq(deliveryOutbox.id, current.id));
  // Log only whitelisted codes, never payloads, links, or transport error text.
  console.error("[delivery-outbox] delivery failed", {
    id: current.id,
    kind: current.kind,
    code,
    terminal,
  });
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
        isNull(deliveryOutbox.failedAt),
        lte(deliveryOutbox.nextAttemptAt, new Date()),
      ),
    )
    .orderBy(deliveryOutbox.nextAttemptAt)
    .limit(100);
  for (const candidate of pending) {
    try {
      await cradle.db.transaction(async (tx) => {
        let send: (() => Promise<void>) | null = null;
        let preparationFailed = false;
        let preparationError: unknown;
        try {
          if (!Object.hasOwn(handlers, candidate.kind))
            throw new UnknownDeliveryKind();
          send = await handlers[candidate.kind]!.prepare(candidate, tx, cradle);
        } catch (error) {
          preparationFailed = true;
          preparationError = error;
        }
        const [current] = await tx
          .select()
          .from(deliveryOutbox)
          .where(eq(deliveryOutbox.id, candidate.id))
          .for("update");
        if (
          !current ||
          current.revisionId !== candidate.revisionId ||
          current.processedAt ||
          current.failedAt ||
          current.nextAttemptAt > new Date()
        )
          return;
        try {
          if (preparationFailed) throw preparationError;
          // SMTP and this commit cannot be atomic. A crash between acceptance
          // and commit can resend; concurrent workers are serialized here.
          if (send) await send();
          await tx
            .update(deliveryOutbox)
            .set({ processedAt: new Date(), payload: {}, lastErrorCode: null })
            .where(eq(deliveryOutbox.id, current.id));
        } catch (error) {
          // Commit failure/backoff while still holding the row lock. A waiting
          // worker then sees the future retry time instead of immediately sending.
          await recordFailure(tx, current, error);
        }
      });
    } catch (error) {
      // SQL/deadlock failures abort the transaction. Reacquire the row before
      // recording recovery state. A commit failure after SMTP acceptance retains
      // the at-least-once limitation described above.
      await cradle.db.transaction(async (tx) => {
        const [current] = await tx
          .select()
          .from(deliveryOutbox)
          .where(eq(deliveryOutbox.id, candidate.id))
          .for("update");
        if (
          !current ||
          current.revisionId !== candidate.revisionId ||
          current.processedAt ||
          current.failedAt ||
          current.nextAttemptAt > new Date()
        )
          return;
        await recordFailure(tx, current, error);
      });
    }
  }
}
