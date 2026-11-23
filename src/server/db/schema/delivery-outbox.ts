import { sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const deliveryOutbox = pgTable(
  "delivery_outbox",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    deliveryKey: text("delivery_key").unique(),
    revisionId: uuid("revision_id").notNull().defaultRandom(),
    kind: text("kind").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    attempts: integer("attempts").notNull().default(0),
  },
  (table) => [
    index("delivery_outbox_pending_idx")
      .on(table.nextAttemptAt)
      .where(sql`${table.processedAt} IS NULL`),
  ],
);
export type DeliveryIntent = typeof deliveryOutbox.$inferSelect;
