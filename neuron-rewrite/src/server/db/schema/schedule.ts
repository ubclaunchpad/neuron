import { AbsenceRequestCategory } from "@/models/interfaces";
import { course } from "@/server/db/schema/course";
import { instructor, volunteer } from "@/server/db/schema/user";
import { sql } from "drizzle-orm";
import {
    boolean,
    check,
    index,
    pgEnum,
    pgTable,
    primaryKey,
    smallint,
    text,
    time,
    timestamp,
    uniqueIndex,
    uuid
} from "drizzle-orm/pg-core";

export const coverageCategory = pgEnum("coverage_category", AbsenceRequestCategory.values);

export const schedule = pgTable("schedule", {
    scheduleId: uuid("schedule_id").primaryKey().defaultRandom(),
    courseId: uuid("course_id").notNull().references(() => course.courseId, { onDelete: "cascade" }),
    dayOfWeek: smallint("day_of_week").notNull(),
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    frequency: text("frequency").notNull(),
    instructorUserId: uuid("instructor_user_id").references(() => instructor.userId, { onDelete: "set null" }),
}, (table) => [
    index().on(table.courseId),
    index().on(table.instructorUserId),
    check("chk_schedule_day", sql`${table.dayOfWeek} BETWEEN 0 AND 6`),
    check("chk_schedule_time", sql`${table.endTime} > ${table.startTime}`),
]);

export const volunteerToSchedule = pgTable("volunteer_to_schedule", {
    volunteerUserId: uuid("volunteer_user_id").notNull().references(() => volunteer.userId, { onDelete: "cascade" }),
    scheduleId: uuid("schedule_id").notNull().references(() => schedule.scheduleId, { onDelete: "cascade" }),
}, (table) => [
    primaryKey({ name: "pk_volunteer_schedule", columns: [table.volunteerUserId, table.scheduleId] }),
    index().on(table.volunteerUserId),
    index().on(table.scheduleId),
]);

export const shift = pgTable("shift", {
    shiftId: uuid("shift_id").primaryKey().defaultRandom(),
    volunteerUserId: uuid("volunteer_user_id").notNull().references(() => volunteer.userId, { onDelete: "cascade" }),
    scheduleId: uuid("schedule_id").notNull().references(() => schedule.scheduleId, { onDelete: "cascade" }),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }).notNull(),
    checkedIn: boolean("checked_in").notNull().default(false),
}, (table) => [
    index().on(table.volunteerUserId),
    index().on(table.scheduleId),
    index().on(table.startAt),
    uniqueIndex("uq_shifts_assignment").on(table.volunteerUserId, table.scheduleId, table.startAt),
    check("chk_shift_time", sql`${table.endAt} > ${table.startAt}`),
]);

export const coverageRequest = pgTable("coverage_request", {
    requestId: uuid("request_id").primaryKey().defaultRandom(),
    shiftId: uuid("shift_id").notNull().references(() => shift.shiftId, { onDelete: "cascade" }),
    approved: boolean("approved").notNull().default(false),
    category: coverageCategory("category").notNull(),
    details: text("details").notNull(),
    comments: text("comments"),
    coveredByVolunteerUserId: uuid("covered_by_volunteer_user_id").references(() => volunteer.userId, { onDelete: "set null" }),
}, (table) => [
    uniqueIndex().on(table.shiftId),
    index().on(table.coveredByVolunteerUserId),
]);