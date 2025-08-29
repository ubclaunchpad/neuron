import { image } from "@/server/db/schema/image";
import { sql } from "drizzle-orm";
import { check, date, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const term = pgTable("term", {
    termId: uuid("term_id").primaryKey().defaultRandom(),
    name: text("term_name").notNull(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
}, (table) => [
    index().on(table.name),
    check("chk_term_date_ok", sql`${table.endDate} >= ${table.startDate}`),
]);

export const course = pgTable("course", {
    courseId: uuid("course_id").primaryKey().defaultRandom(),
    termId: uuid("term_id").references(() => term.termId, { onDelete: "cascade" }),
    imageId: uuid("image_id").references(() => image.imageId, { onDelete: "set null" }),
    courseName: text("course_name").notNull(),
    instructions: text("instructions"),
    zoomLink: text("zoom_link").notNull(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    category: text("category"),
    subcategory: text("subcategory"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
    index().on(table.imageId),
    check("chk_course_date_ok", sql`${table.endDate} >= ${table.startDate}`),
]);