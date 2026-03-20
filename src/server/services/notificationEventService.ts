import type { Drizzle } from "@/server/db";
import type { INotificationService } from "@/server/services/notificationService";
import {
  schedule,
  volunteerToSchedule,
  instructorToSchedule,
} from "@/server/db/schema/schedule";
import { shift } from "@/server/db/schema/shift";
import { and, eq, inArray, lt, gt, notInArray } from "drizzle-orm";

interface ShiftCancelledParams {
  shiftId: string;
  className: string;
  shiftDate: string;
  cancelReason: string;
  cancelledByUserId: string;
  cancelledByName: string;
}

interface CoverageRequestedParams {
  coverageRequestId: string;
  shiftId: string;
  classId: string;
  className: string;
  shiftDate: string;
  shiftStartAt: Date;
  shiftEndAt: Date;
  requestingVolunteerUserId: string;
  requestingVolunteerName: string;
  reason: string;
}

export interface INotificationEventService {
  notifyShiftCancelled(params: ShiftCancelledParams): Promise<void>;
  notifyCoverageRequested(params: CoverageRequestedParams): Promise<void>;
}

export class NotificationEventService implements INotificationEventService {
  private readonly notificationService: INotificationService;
  private readonly db: Drizzle;

  constructor({
    notificationService,
    db,
  }: {
    notificationService: INotificationService;
    db: Drizzle;
  }) {
    this.notificationService = notificationService;
    this.db = db;
  }

  async notifyShiftCancelled(params: ShiftCancelledParams): Promise<void> {
    await this.notificationService.notify({
      type: "shift.cancelled",
      audience: [
        { kind: "shift", shiftId: params.shiftId },
        { kind: "role", role: "admin" },
      ],
      context: {
        shiftId: params.shiftId,
        className: params.className,
        shiftDate: params.shiftDate,
        cancelReason: params.cancelReason,
        cancelledByName: params.cancelledByName,
      },
      actorId: params.cancelledByUserId,
      idempotencyKey: `shift-cancelled-${params.shiftId}`,
    });
  }

  async notifyCoverageRequested(
    params: CoverageRequestedParams,
  ): Promise<void> {
    // 1. Notify admins + class instructors (with reason)
    const instructorIds = await this.getClassInstructorUserIds(params.classId);

    await this.notificationService.notify({
      type: "coverage.requested",
      audience: [
        { kind: "role", role: "admin" },
        ...(instructorIds.length > 0
          ? [{ kind: "users" as const, userIds: instructorIds }]
          : []),
      ],
      context: {
        coverageRequestId: params.coverageRequestId,
        shiftId: params.shiftId,
        className: params.className,
        shiftDate: params.shiftDate,
        requestingVolunteerName: params.requestingVolunteerName,
        reason: params.reason,
      },
      actorId: params.requestingVolunteerUserId,
      excludeUserIds: [params.requestingVolunteerUserId],
      idempotencyKey: `coverage-requested-${params.coverageRequestId}`,
    });

    // 2. Notify eligible volunteers (without reason)
    const eligibleIds = await this.getEligibleVolunteerUserIds(
      params.classId,
      params.shiftStartAt,
      params.shiftEndAt,
      params.requestingVolunteerUserId,
    );

    if (eligibleIds.length > 0) {
      await this.notificationService.notify({
        type: "coverage.available",
        audience: { kind: "users", userIds: eligibleIds },
        context: {
          coverageRequestId: params.coverageRequestId,
          shiftId: params.shiftId,
          className: params.className,
          shiftDate: params.shiftDate,
        },
        actorId: params.requestingVolunteerUserId,
        idempotencyKey: `coverage-available-${params.coverageRequestId}`,
      });
    }
  }

  /**
   * Get instructor user IDs for all schedules of a class.
   */
  private async getClassInstructorUserIds(classId: string): Promise<string[]> {
    const schedules = await this.db
      .select({ id: schedule.id })
      .from(schedule)
      .where(eq(schedule.courseId, classId));

    const scheduleIds = schedules.map((s) => s.id);
    if (scheduleIds.length === 0) return [];

    const instructors = await this.db
      .select({ userId: instructorToSchedule.instructorUserId })
      .from(instructorToSchedule)
      .where(inArray(instructorToSchedule.scheduleId, scheduleIds));

    return [...new Set(instructors.map((i) => i.userId))];
  }

  /**
   * Get volunteer user IDs for a class who do NOT have a conflicting shift
   * overlapping with the given time window.
   */
  private async getEligibleVolunteerUserIds(
    classId: string,
    shiftStartAt: Date,
    shiftEndAt: Date,
    excludeUserId: string,
  ): Promise<string[]> {
    // Get all schedules for the class
    const schedules = await this.db
      .select({ id: schedule.id })
      .from(schedule)
      .where(eq(schedule.courseId, classId));

    const scheduleIds = schedules.map((s) => s.id);
    if (scheduleIds.length === 0) return [];

    // Get all volunteers for the class
    const volunteers = await this.db
      .select({ userId: volunteerToSchedule.volunteerUserId })
      .from(volunteerToSchedule)
      .where(inArray(volunteerToSchedule.scheduleId, scheduleIds));

    const allVolunteerIds = [
      ...new Set(volunteers.map((v) => v.userId)),
    ].filter((id) => id !== excludeUserId);

    if (allVolunteerIds.length === 0) return [];

    // Find volunteers with a conflicting shift (overlapping time window)
    // Two shifts overlap when: shift.startAt < shiftEndAt AND shift.endAt > shiftStartAt
    const conflicting = await this.db
      .selectDistinct({ userId: volunteerToSchedule.volunteerUserId })
      .from(volunteerToSchedule)
      .innerJoin(shift, eq(shift.scheduleId, volunteerToSchedule.scheduleId))
      .where(
        and(
          inArray(volunteerToSchedule.volunteerUserId, allVolunteerIds),
          lt(shift.startAt, shiftEndAt),
          gt(shift.endAt, shiftStartAt),
          eq(shift.canceled, false),
        ),
      );

    const conflictingIds = new Set(conflicting.map((c) => c.userId));
    return allVolunteerIds.filter((id) => !conflictingIds.has(id));
  }
}
