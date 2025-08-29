import { pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const image = pgTable("image", {
    imageId: uuid("image_id").primaryKey().defaultRandom(),
    filename: varchar("filename", { length: 255 }),
    mimeType: varchar("mime_type", { length: 100 }),
    data: text("data").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
