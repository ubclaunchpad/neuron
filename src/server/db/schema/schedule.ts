import { shift } from "@/server/db/schema/shift";
import { relations, sql } from "drizzle-orm";
import { check, date, index, pgTable, primaryKey, smallint, text, uuid } from "drizzle-orm/pg-core";
import { course } from "./course";
import { user, volunteer } from "./user";

export const schedule = pgTable("schedule", {
    id: uuid("id").primaryKey().defaultRandom(),
    courseId: uuid("course_id").notNull().references(() => course.id, { onDelete: "cascade" }),
    durationMinutes: smallint("duration_minutes").notNull(),
    effectiveStart: date("effective_start"),
    effectiveEnd: date("effective_end"),
    rrule: text("rrule").notNull(),
    instructorUserId: uuid("instructor_user_id").references(() => user.id, { onDelete: "set null" }),
}, (table) => [
    index().on(table.courseId),
    index().on(table.instructorUserId),
    check("chk_schedule_duration_positive", sql`${table.durationMinutes} > 0`),
    check(
        "chk_schedule_effective_range_valid",
        sql`${table.effectiveEnd} IS NULL
             OR ${table.effectiveStart} IS NULL
             OR ${table.effectiveEnd} >= ${table.effectiveStart}`,
    ),
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