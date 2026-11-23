import { randomUUID } from "crypto";
import { and, eq, isNull, lte, sql } from "drizzle-orm";
import { ZodError } from "zod";
import type { Drizzle, Transaction } from "@/server/db";
import {
  deliveryOutbox,
  type DeliveryIntent,
} from "@/server/db/schema/notification";
import {
  deliveryJobsByName,
  type DeliverableJobName,
  type DeliveryPayload,
} from "@/server/jobs/registry";
import type {
  DeliveryDefinition,
  DeliveryOptions,
  JobRuntimeContext,
} from "@/server/jobs/types";

export interface IDeliveryService {
  deliver<TName extends DeliverableJobName>(
    name: TName,
    data: DeliveryPayload<TName>,
    options: DeliveryOptions,
  ): Promise<void>;
  cancel(
    name: DeliverableJobName,
    key: string,
    options: Pick<DeliveryOptions, "transaction">,
  ): Promise<void>;
  process(context: JobRuntimeContext): Promise<void>;
}

class UnknownDeliveryJob extends Error {}

/** Owns durable delivery state; JobService remains the public scheduling API. */
export class DeliveryService implements IDeliveryService {
  static readonly MAX_ATTEMPTS = 8;
  private readonly db: Drizzle;

  constructor({ db }: { db: Drizzle }) {
    this.db = db;
  }

  async deliver<TName extends DeliverableJobName>(
    name: TName,
    data: DeliveryPayload<TName>,
    options: DeliveryOptions,
  ): Promise<void> {
    const definition = this.getDefinition(name);
    const payload = definition.payloadSchema.parse(data);
    if (options.replaceExisting && !options.idempotencyKey)
      throw new Error("Replacing a delivery requires an idempotency key");
    const values = {
      kind: name,
      payload,
      deliveryKey: options.idempotencyKey
        ? `${name}:${options.idempotencyKey}`
        : null,
      revisionId: randomUUID(),
      processedAt: null,
      failedAt: null,
      lastErrorCode: null,
      nextAttemptAt: new Date(),
      attempts: 0,
    };
    const insert = options.transaction.insert(deliveryOutbox).values(values);
    if (options.replaceExisting)
      await insert.onConflictDoUpdate({
        target: deliveryOutbox.deliveryKey,
        set: values,
      });
    else
      await insert.onConflictDoNothing({ target: deliveryOutbox.deliveryKey });
  }

  async cancel(
    name: DeliverableJobName,
    key: string,
    { transaction }: Pick<DeliveryOptions, "transaction">,
  ): Promise<void> {
    this.getDefinition(name);
    await transaction
      .update(deliveryOutbox)
      .set({
        revisionId: randomUUID(),
        processedAt: new Date(),
        failedAt: null,
        payload: {},
      })
      .where(
        and(
          eq(deliveryOutbox.deliveryKey, `${name}:${key}`),
          isNull(deliveryOutbox.processedAt),
        ),
      );
  }

  async process(context: JobRuntimeContext): Promise<void> {
    const pending = await this.db
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
    const deadline = Date.now() + 45_000;
    for (const candidate of pending) {
      if (Date.now() >= deadline) break;
      await this.processIntent(candidate, context);
    }
  }

  private getDefinition(name: string): DeliveryDefinition<any> {
    const definition = deliveryJobsByName.get(name);
    if (!definition) throw new UnknownDeliveryJob();
    return definition;
  }

  private async claim(tx: Transaction, candidate: DeliveryIntent) {
    const [current] = await tx
      .select()
      .from(deliveryOutbox)
      .where(eq(deliveryOutbox.id, candidate.id))
      .for("update", { skipLocked: true });
    if (
      !current ||
      current.revisionId !== candidate.revisionId ||
      current.processedAt ||
      current.failedAt ||
      current.nextAttemptAt > new Date()
    )
      return null;
    return current;
  }

  private async processIntent(
    candidate: DeliveryIntent,
    context: JobRuntimeContext,
  ): Promise<void> {
    let definition: DeliveryDefinition<any> | undefined;
    try {
      definition = this.getDefinition(candidate.kind);
      await this.db.transaction(async (tx) => {
        // Bound domain-lock waits as well as outbox-lock contention.
        await tx.execute(sql`SET LOCAL lock_timeout = '5s'`);
        const payload = definition!.payloadSchema.parse(candidate.payload);
        const send = await definition!.prepare(payload, tx, context);
        const current = await this.claim(tx, candidate);
        if (!current) return;
        try {
          // SMTP and commit cannot be atomic; a crash after acceptance can resend.
          if (send) await send();
          await tx
            .update(deliveryOutbox)
            .set({ processedAt: new Date(), payload: {}, lastErrorCode: null })
            .where(eq(deliveryOutbox.id, current.id));
        } catch (error) {
          // Commit backoff before releasing the claim so waiting workers skip it.
          await this.recordFailure(tx, current, error, definition);
        }
      });
    } catch (error) {
      // Preparation/SQL errors roll back immediately, preserving the original error
      // instead of querying an aborted transaction and replacing it with 25P02.
      await this.db.transaction(async (tx) => {
        const current = await this.claim(tx, candidate);
        if (current) await this.recordFailure(tx, current, error, definition);
      });
    }
  }

  private async recordFailure(
    tx: Transaction,
    current: DeliveryIntent,
    error: unknown,
    definition?: DeliveryDefinition<any>,
  ) {
    const databaseError =
      error instanceof Error && error.cause ? error.cause : error;
    const sqlCode =
      typeof databaseError === "object" &&
      databaseError !== null &&
      "code" in databaseError
        ? databaseError.code
        : undefined;
    const databaseFailure =
      typeof sqlCode === "string" &&
      ["40P01", "40001", "55P03", "23505", "23503", "42P01", "42703"].includes(
        sqlCode,
      )
        ? { code: `SQL_${sqlCode}`, permanent: false }
        : undefined;
    const failure =
      error instanceof UnknownDeliveryJob
        ? { code: "UNKNOWN_JOB", permanent: true }
        : error instanceof ZodError
          ? { code: "INVALID_PAYLOAD", permanent: true }
          : (databaseFailure ??
            definition?.classifyFailure?.(error) ?? {
              code: "DELIVERY_FAILED",
              permanent: false,
            });
    const attempts = current.attempts + 1;
    const terminal =
      failure.permanent || attempts >= DeliveryService.MAX_ATTEMPTS;
    await tx
      .update(deliveryOutbox)
      .set({
        attempts,
        failedAt: terminal ? new Date() : null,
        lastErrorCode: failure.code,
        nextAttemptAt: new Date(
          Date.now() +
            Math.min(3600, 30 * 2 ** Math.min(attempts - 1, 7)) * 1000,
        ),
      })
      .where(eq(deliveryOutbox.id, current.id));
    console.error("[delivery-outbox] delivery failed", {
      id: current.id,
      kind: current.kind,
      code: failure.code,
      terminal,
    });
  }
}
