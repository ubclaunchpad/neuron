import { CoverageRequestCategory, CoverageStatus } from "@/models/api/coverage";
import { AttendanceStatus } from "@/models/interfaces";
import { course } from "@/server/db/schema/course";
import { schedule } from "@/server/db/schema/schedule";
import { user, volunteer } from "@/server/db/schema/user";
import { eq, not, relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const coverageCategory = pgEnum(
  "coverage_category",
  CoverageRequestCategory.values,
);
export const coverageStatus = pgEnum("coverage_status", CoverageStatus.values);

export const shift = pgTable(
  "shift",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseId: uuid("class_id")
      .notNull()
      .references(() => course.id, { onDelete: "cascade" }),
    scheduleId: uuid("schedule_id")
      .notNull()
      .references(() => schedule.id, { onDelete: "cascade" }),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }).notNull(),
    date: date("date").notNull(),

    canceled: boolean("canceled").notNull().default(false),
    cancelReason: text("cancel_reason"),
    cancelledByUserId: uuid("cancelled_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    canceledAt: timestamp("canceled_at", { withTimezone: true }),
  },
  (table) => [
    index().on(table.courseId),
    index().on(table.scheduleId),
    index("idx_shift_date")
      .on(table.date, table.courseId)
      .where(not(table.canceled)),
    index("idx_shift_start").on(table.startAt).where(not(table.canceled)),
    index("idx_shift_slot").on(table.scheduleId),
    check("chk_shift_time", sql`${table.endAt} > ${table.startAt}`),
  ],
);
export type ShiftDB = typeof shift.$inferSelect;

export const shiftRelations = relations(shift, ({ one, many }) => ({
  course: one(course, {
    fields: [shift.courseId],
    references: [course.id],
  }),
  schedule: one(schedule, {
    fields: [shift.scheduleId],
    references: [schedule.id],
  }),
  coverageRequests: many(coverageRequest),
}));

export const coverageRequest = pgTable(
  "coverage_request",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shiftId: uuid("shift_id")
      .notNull()
      .references(() => shift.id, { onDelete: "cascade" }),
    category: coverageCategory("category").notNull(),
    details: text("details").notNull(),
    comments: text("comments"),
    status: coverageStatus("status").notNull().default(CoverageStatus.open),
    requestingVolunteerUserId: uuid("requesting_volunteer_user_id")
      .notNull()
      .references(() => volunteer.userId, { onDelete: "cascade" }),
    coveredByVolunteerUserId: uuid("covered_by_volunteer_user_id").references(
      () => volunteer.userId,
      { onDelete: "set null" },
    ),
  },
  (table) => [
    uniqueIndex()
      .on(table.shiftId, table.requestingVolunteerUserId)
      .where(
        not(
          eq(
            table.status,
            sql.raw(
              `'${CoverageStatus.withdrawn}'::${coverageStatus.enumName}`,
            ),
          ),
        ),
      ),
    index().on(table.shiftId, table.status),
    index().on(table.coveredByVolunteerUserId),
    index().on(table.requestingVolunteerUserId),
  ],
);
export type CoverageRequestDB = typeof coverageRequest.$inferSelect;

export const coverageRequestRelations = relations(
  coverageRequest,
  ({ one }) => ({
    shift: one(shift, {
      fields: [coverageRequest.shiftId],
      references: [shift.id],
    }),
    requestingVolunteer: one(volunteer, {
      fields: [coverageRequest.requestingVolunteerUserId],
      references: [volunteer.userId],
    }),
    coveredByVolunteer: one(volunteer, {
      fields: [coverageRequest.coveredByVolunteerUserId],
      references: [volunteer.userId],
    }),
  }),
);

export const attendanceStatus = pgEnum(
  "attendance_status",
  AttendanceStatus.values,
);

export const shiftAttendance = pgTable(
  "shift_attendance",
  {
    shiftId: uuid("shift_id")
      .notNull()
      .references(() => shift.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => volunteer.userId, { onDelete: "restrict" }),
    status: attendanceStatus("status").notNull(),
    checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
    minutesWorked: smallint("minutes_worked"),
  },
  (table) => [
    primaryKey({
      name: "pk_shift_attendance",
      columns: [table.shiftId, table.userId],
    }),
    index().on(table.userId),
  ],
);
export type ShiftAttendanceDB = typeof shiftAttendance.$inferSelect;

export const shiftAttendanceRelations = relations(
  shiftAttendance,
  ({ one }) => ({
    shift: one(shift, {
      fields: [shiftAttendance.shiftId],
      references: [shift.id],
    }),
    user: one(user, {
      fields: [shiftAttendance.userId],
      references: [user.id],
    }),
  }),
);
