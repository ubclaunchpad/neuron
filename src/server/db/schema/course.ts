import { shift } from "@/server/db/schema/shift";
import { relations, sql } from "drizzle-orm";
import { boolean, check, date, index, pgTable, primaryKey, smallint, text, time, timestamp, uuid } from "drizzle-orm/pg-core";
import { user, volunteer } from "./user";

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
}));

export const course = pgTable("course", {
    id: uuid("id").primaryKey().defaultRandom(),
    termId: uuid("term_id").references(() => term.id, { onDelete: "cascade" }),
    image: text("image"),
    name: text("name").notNull(),
    published: boolean("published").notNull().default(false),
    description: text("description"),
    meetingURL: text("meeting_url"),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    category: text("category"),
    subcategory: text("subcategory"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
    index().on(table.termId),
    index().on(table.name),
    check("chk_course_date_ok", sql`${table.endDate} >= ${table.startDate}`),
]);
export type CourseDB = typeof course.$inferSelect;

export const courseRelations = relations(course, ({ one, many }) => ({
    term: one(term, {
        fields: [course.termId],
        references: [term.id],
    }),
    schedules: many(schedule),
}));

export const schedule = pgTable("schedule", {
    id: uuid("id").primaryKey().defaultRandom(),
    courseId: uuid("course_id").notNull().references(() => course.id, { onDelete: "cascade" }),
    dayOfWeek: smallint("day_of_week").notNull(),
    startTime: time("start_time", { withTimezone: true }).notNull(),
    durationMinutes: smallint("duration_minutes").notNull(),
    intervalWeeks: smallint("interval_weeks").notNull().default(1),
    weekOffset: smallint("week_offset").notNull().default(0),
    instructorUserId: uuid("instructor_user_id").references(() => user.id, { onDelete: "set null" }),
}, (table) => [
    index().on(table.courseId),
    index().on(table.instructorUserId),
    index("idx_schedule_day_time").on(table.dayOfWeek, table.startTime),
    check("chk_schedule_day", sql`${table.dayOfWeek} BETWEEN 0 AND 6`),
    check("chk_interval_weeks", sql`${table.intervalWeeks} IN (1,2)`),
    check("chk_week_offset", sql`${table.weekOffset} IN (0,1)`),
]);
export type ScheduleDB = typeof schedule.$inferSelect;

export const scheduleRelations = relations(schedule, ({ one, many }) => ({
    course: one(course, {
        fields: [schedule.courseId],
        references: [course.id],
    }),
    instructor: one(user, {
        fields: [schedule.instructorUserId],
        references: [user.id],
    }),
    shifts: many(shift),
    volunteers: many(volunteerToSchedule),
}));

export const volunteerToSchedule = pgTable("volunteer_to_schedule", {
    volunteerUserId: uuid("volunteer_user_id").notNull().references(() => volunteer.userId, { onDelete: "cascade" }),
    scheduleId: uuid("schedule_id").notNull().references(() => schedule.id, { onDelete: "cascade" }),
}, (table) => [
    primaryKey({ name: "pk_volunteer_schedule", columns: [table.volunteerUserId, table.scheduleId] }),
    index().on(table.volunteerUserId),
    index().on(table.scheduleId),
]);
export type VolunteerToScheduleDB = typeof volunteerToSchedule.$inferSelect;

export const volunteerToScheduleRelations = relations(volunteerToSchedule, ({ one }) => ({
    volunteer: one(volunteer, {
        fields: [volunteerToSchedule.volunteerUserId],
        references: [volunteer.userId],
    }),
    schedule: one(schedule, {
        fields: [volunteerToSchedule.scheduleId],
        references: [schedule.id],
    }),
}));