import { relations, sql } from "drizzle-orm";
import { boolean, check, date, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { schedule } from "./schedule";

export const term = pgTable("term", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("term_name").notNull(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
}, (table) => [
    index().on(table.name),
    check("chk_term_date_ok", sql`${table.endDate} >= ${table.startDate}`),
]);
export type TermDB = typeof term.$inferSelect;

export const termRelations = relations(term, ({ many }) => ({
    courses: many(course),
    blackouts: many(blackout),
}));

export const blackout = pgTable("blackout", {
    id: uuid("id").defaultRandom().primaryKey(),
    termId: uuid("term_id").references(() => term.id, { onDelete: "cascade" }),
    scheduleId: uuid("schedule_id").references(() => schedule.id, { onDelete: "cascade" }),
    startsOn: date("starts_on").notNull(),
    endsOn: date("ends_on").notNull(),
}, (table) => [
    index().on(table.termId, table.startsOn, table.endsOn),
    index().on(table.scheduleId, table.startsOn, table.endsOn),
    check("chk_blackout_owner_xor", sql`( ${table.termId} IS NOT NULL ) <> ( ${table.scheduleId} IS NOT NULL )`),
    check("chk_blackout_range_valid", sql`${table.endsOn} >= ${table.startsOn}`),
]);
export type BlackoutDB = typeof blackout.$inferSelect;

export const blackoutRelations = relations(blackout, ({ one }) => ({
    term: one(term, {
        fields: [blackout.termId],
        references: [term.id],
    }),
    schedule: one(schedule, {
        fields: [blackout.scheduleId],
        references: [schedule.id],
    }),
}));

export const course = pgTable("course", {
    id: uuid("id").primaryKey().defaultRandom(),
    termId: uuid("term_id").notNull().references(() => term.id, { onDelete: "cascade" }),
    image: text("image"),
    name: text("name").notNull(),
    published: boolean("published").notNull().default(false),
    description: text("description"),
    meetingURL: text("meeting_url"),
    category: text("category"),
    subcategory: text("subcategory"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
    index().on(table.termId),
    index().on(table.name),
]);
export type CourseDB = typeof course.$inferSelect;

export const courseRelations = relations(course, ({ one, many }) => ({
    term: one(term, {
        fields: [course.termId],
        references: [term.id],
    }),
    schedules: many(schedule),
}));