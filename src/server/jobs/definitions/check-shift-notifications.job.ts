import { eq, and, inArray } from "drizzle-orm";
import type { Drizzle } from "@/server/db";
import { shift, coverageRequest, shiftAttendance } from "@/server/db/schema";
import { course } from "@/server/db/schema/course";
import { volunteerToSchedule } from "@/server/db/schema/schedule";
import { user } from "@/server/db/schema/user";
import { CoverageStatus } from "@/models/api/coverage";
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

      // Get effective volunteer roster (accounting for coverage swaps)
      const effectiveVolunteers = await getEffectiveVolunteers(
        db,
        shiftRow.scheduleId,
        shiftId,
      );

      if (effectiveVolunteers.length === 0) return;

      if (checkType === "reminder") {
        await notificationEventService.notifyShiftReminder({
          shiftId,
          className: shiftRow.className,
          shiftDate: shiftRow.startAt.toLocaleDateString(),
          shiftTime: shiftRow.startAt.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          }),
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
          shiftDate: shiftRow.startAt.toLocaleDateString(),
          volunteerNames: missingVolunteers.map((v) => v.name).join(", "),
          volunteerCount: missingVolunteers.length,
        });
      }
    },
  };

/**
 * Get the effective volunteer roster for a shift, accounting for coverage swaps.
 * Original volunteers with resolved coverage are replaced by covering volunteers.
 */
async function getEffectiveVolunteers(
  db: Drizzle,
  scheduleId: string,
  shiftId: string,
) {
  // Get all original volunteers for the schedule
  const originalVolunteers = await db
    .select({
      userId: volunteerToSchedule.volunteerUserId,
      name: user.name,
      lastName: user.lastName,
    })
    .from(volunteerToSchedule)
    .innerJoin(user, eq(user.id, volunteerToSchedule.volunteerUserId))
    .where(eq(volunteerToSchedule.scheduleId, scheduleId));

  // Get resolved coverage requests for this shift
  const resolvedCoverage = await db
    .select({
      requestingVolunteerUserId: coverageRequest.requestingVolunteerUserId,
      coveredByVolunteerUserId: coverageRequest.coveredByVolunteerUserId,
    })
    .from(coverageRequest)
    .where(
      and(
        eq(coverageRequest.shiftId, shiftId),
        eq(coverageRequest.status, CoverageStatus.resolved),
      ),
    );

  // Build sets for quick lookup
  const replacedUserIds = new Set(
    resolvedCoverage.map((c) => c.requestingVolunteerUserId),
  );
  const coveringUserIds = resolvedCoverage
    .map((c) => c.coveredByVolunteerUserId)
    .filter((id): id is string => id != null);

  // Start with original volunteers minus those replaced by coverage
  const effectiveVolunteers = originalVolunteers
    .filter((v) => !replacedUserIds.has(v.userId))
    .map((v) => ({ userId: v.userId, name: `${v.name} ${v.lastName}` }));

  // Add covering volunteers
  if (coveringUserIds.length > 0) {
    const coveringUsers = await db
      .select({
        userId: user.id,
        name: user.name,
        lastName: user.lastName,
      })
      .from(user)
      .where(inArray(user.id, coveringUserIds));

    for (const u of coveringUsers) {
      effectiveVolunteers.push({
        userId: u.userId,
        name: `${u.name} ${u.lastName}`,
      });
    }
  }

  return effectiveVolunteers;
}
