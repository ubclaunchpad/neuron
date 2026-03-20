import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./user";

export const notificationChannel = pgEnum("notification_channel", [
  "email",
  "in_app",
  "push",
]);

export const notification = pgTable(
  "notification",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    linkUrl: text("link_url"),
    sourceType: text("source_type"),
    sourceId: uuid("source_id"),
    actorId: uuid("actor_id").references(() => user.id, {
      onDelete: "set null",
    }),
    read: boolean("read").notNull().default(false),
    readAt: timestamp("read_at", { withTimezone: true }),
    emailSent: boolean("email_sent").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    idempotencyKey: text("idempotency_key").unique(),
  },
  (table) => [
    index("idx_notification_user_created").on(table.userId, table.createdAt),
    index("idx_notification_user_read").on(table.userId, table.read),
    index("idx_notification_type").on(table.type),
    index("idx_notification_source").on(table.sourceType, table.sourceId),
  ],
);
export type NotificationDB = typeof notification.$inferSelect;

export const notificationRelations = relations(notification, ({ one }) => ({
  user: one(user, {
    fields: [notification.userId],
    references: [user.id],
    relationName: "notificationRecipient",
  }),
  actor: one(user, {
    fields: [notification.actorId],
    references: [user.id],
    relationName: "notificationActor",
  }),
}));

export const notificationPreference = pgTable(
  "notification_preference",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    channel: notificationChannel("channel").notNull(),
    enabled: boolean("enabled").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("uq_notification_pref_user_type_channel").on(
      table.userId,
      table.type,
      table.channel,
    ),
    index("idx_notification_pref_user").on(table.userId),
  ],
);
export type NotificationPreferenceDB =
  typeof notificationPreference.$inferSelect;

export const notificationPreferenceRelations = relations(
  notificationPreference,
  ({ one }) => ({
    user: one(user, {
      fields: [notificationPreference.userId],
      references: [user.id],
    }),
  }),
);
