import { eq } from "drizzle-orm";
import { shift, shiftAttendance } from "@/server/db/schema";
import { course } from "@/server/db/schema/course";
import { getEffectiveVolunteerUsersForShift } from "@/server/services/entity/shiftAssignment";
import { formatDate, formatTime } from "@/lib/constants";
import type { RegisteredJob } from "../types";

export type CheckShiftNotificationsPayload = {
  shiftId: string;
  checkType: "reminder" | "no-checkin";
};

export const checkShiftNotificationsJob: RegisteredJob<CheckShiftNotificationsPayload> =
  {
    name: "jobs.check-shift-notifications",
    retryOpts: {
      retryLimit: 2,
      retryDelay: 60,
      retryBackoff: true,
    },
    handler: async (payload, { cradle }) => {
      const { shiftId, checkType } = payload;
      const { db, notificationEventService } = cradle;

      // Fetch shift details
      const [shiftRow] = await db
        .select({
          id: shift.id,
          startAt: shift.startAt,
          endAt: shift.endAt,
          canceled: shift.canceled,
          scheduleId: shift.scheduleId,
          courseId: shift.courseId,
          className: course.name,
        })
        .from(shift)
        .innerJoin(course, eq(course.id, shift.courseId))
        .where(eq(shift.id, shiftId));

      if (!shiftRow || shiftRow.canceled) return;

      // Resolve effective active volunteer roster via shared assignment contract
      const effectiveVolunteers = (
        await getEffectiveVolunteerUsersForShift(db, shiftId, {
          activeOnly: true,
        })
      ).map((v) => ({
        userId: v.volunteerUserId,
        name: `${v.name} ${v.lastName}`,
      }));

      if (effectiveVolunteers.length === 0) return;

      if (checkType === "reminder") {
        await notificationEventService.notifyShiftReminder({
          shiftId,
          className: shiftRow.className,
          shiftDate: formatDate(shiftRow.startAt),
          shiftTime: formatTime(shiftRow.startAt),
          volunteerUserIds: effectiveVolunteers.map((v) => v.userId),
        });
      } else {
        // no-checkin: find volunteers who have no attendance record
        const attendanceRecords = await db
          .select({ userId: shiftAttendance.userId })
          .from(shiftAttendance)
          .where(eq(shiftAttendance.shiftId, shiftId));

        const checkedInUserIds = new Set(
          attendanceRecords.map((a) => a.userId),
        );
        const missingVolunteers = effectiveVolunteers.filter(
          (v) => !checkedInUserIds.has(v.userId),
        );

        if (missingVolunteers.length === 0) return;

        await notificationEventService.notifyShiftNoCheckin({
          shiftId,
          className: shiftRow.className,
          shiftDate: formatDate(shiftRow.startAt),
          volunteerNames: missingVolunteers.map((v) => v.name).join(", "),
          volunteerCount: missingVolunteers.length,
        });
      }
    },
  };
