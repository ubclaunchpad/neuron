import { hasPermission } from "@/lib/auth/extensions/permissions";
import { formatDate } from "@/lib/constants";
import type { ICurrentSessionService } from "@/server/services/currentSessionService";
import { CoverageStatus } from "@/models/api/coverage";
import type {
  CancelShiftInput,
  CreateShiftInput,
  GetShiftsInput,
  ShiftIdInput,
} from "@/models/api/shift";
import { AttendanceStatus, Role } from "@/models/interfaces";
import {
  buildShift,
  getListShift,
  getListShiftWithPersonalStatus,
  getListShiftWithRosterStatus,
  getSingleShift,
  getSingleShiftWithPersonalContext,
  getSingleShiftWithRosterContext,
  type ListShift,
  type ListShiftWithPersonalStatus,
  type ListShiftWithRosterStatus,
  type Shift,
  type ShiftAttendanceSummary,
  type SingleShift,
  type SingleShiftWithPersonalContext,
  type SingleShiftWithRosterContext,
} from "@/models/shift";
import { buildUser } from "@/models/user";
import { buildVolunteer } from "@/models/volunteer";
import { type Drizzle, type Transaction } from "@/server/db";
import { course, type CourseDB } from "@/server/db/schema/course";
import { schedule, type ScheduleDB } from "@/server/db/schema/schedule";
import {
  coverageRequest,
  shift,
  shiftAttendance,
  type ShiftDB,
} from "@/server/db/schema/shift";
import {
  instructorUserView,
  user,
  volunteerUserView,
} from "@/server/db/schema/user";
import { NeuronError, NeuronErrorCodes } from "@/server/errors/neuron-error";
import {
  getEffectiveVolunteerAssignmentsForShifts,
  getShiftInstructorAssignmentsForShifts,
  isInstructorAssignedToShiftSql,
  isVolunteerEffectivelyAssignedToShift,
  isVolunteerEffectivelyAssignedToShiftSql,
  snapshotScheduleAssignmentsToShift,
} from "@/server/services/entity/shiftAssignment";
import type { INotificationEventService } from "@/server/services/notificationEventService";
import type { IJobService } from "@/server/services/jobService";
import { term } from "@/server/db/schema/course";
import {
  and,
  eq,
  exists,
  getViewSelectedFields,
  gte,
  inArray,
  lte,
  or,
  sql,
  type SQL,
} from "drizzle-orm";

type ShiftRow = {
  shift: ShiftDB;
  course: CourseDB;
  schedule: ScheduleDB;
};

type ListShiftView =
  | ListShift
  | ListShiftWithPersonalStatus
  | ListShiftWithRosterStatus;

type SingleShiftView =
  | SingleShift
  | SingleShiftWithPersonalContext
  | SingleShiftWithRosterContext;

const coverageStatusPriority = {
  [CoverageStatus.open]: 0,
  [CoverageStatus.resolved]: 1,
  [CoverageStatus.withdrawn]: 2,
} as const;

export interface IShiftService {
  checkIn(
    shiftId: string,
    volunteerId: string,
  ): Promise<ShiftAttendanceSummary>;
  listWindow(input: GetShiftsInput): Promise<{
    cursor: string;
    shifts: ListShiftView[];
    nextCursor: string;
    prevCursor: string;
  }>;
  getShiftById(shiftId: string, userId: string): Promise<SingleShiftView>;
  getShiftsByIds(shiftIds: string[]): Promise<Shift[]>;
  createShift(input: CreateShiftInput, tx?: Transaction): Promise<string>;
  deleteShift(input: ShiftIdInput): Promise<void>;
  cancelShift(input: CancelShiftInput): Promise<void>;
  assertValidShift(
    volunteerId: string,
    shiftId: string,
    tx?: Transaction,
  ): Promise<void>;
}

function sortCoverageRequestsByStatus(
  coverages: Shift["coverageRequests"],
): Shift["coverageRequests"] {
  return [...coverages].sort(
    (a, b) =>
      coverageStatusPriority[a.status] - coverageStatusPriority[b.status],
  );
}

export class ShiftService implements IShiftService {
  private readonly db: Drizzle;
  private readonly currentSessionService: ICurrentSessionService;
  private readonly notificationEventService: INotificationEventService;
  private readonly jobService: IJobService;

  constructor({
    db,
    currentSessionService,
    notificationEventService,
    jobService,
  }: {
    db: Drizzle;
    currentSessionService: ICurrentSessionService;
    notificationEventService: INotificationEventService;
    jobService: IJobService;
  }) {
    this.db = db;
    this.currentSessionService = currentSessionService;
    this.notificationEventService = notificationEventService;
    this.jobService = jobService;
  }

  private async getViewer(
    userId?: string,
  ): Promise<{ id: string; role: Role } | null> {
    if (!userId) return null;

    const [userRow] = await this.db
      .select({
        id: user.id,
        role: user.role,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!userRow) {
      throw new NeuronError(
        `User with id ${userId} was not found`,
        NeuronErrorCodes.NOT_FOUND,
      );
    }

    return userRow;
  }

  private buildVolunteerVisibilityCondition(
    userId: string,
  ): SQL<unknown> | undefined {
    return or(
      isVolunteerEffectivelyAssignedToShiftSql(shift.id, userId),
      exists(
        this.db
          .select({ one: sql`1` })
          .from(coverageRequest)
          .where(
            and(
              eq(coverageRequest.shiftId, shift.id),
              eq(coverageRequest.requestingVolunteerUserId, userId),
            ),
          ),
      ),
    );
  }

  private buildInstructorVisibilityCondition(userId: string): SQL<unknown> {
    return isInstructorAssignedToShiftSql(shift.id, userId);
  }

  private async hydrateShiftRows(rows: ShiftRow[]): Promise<Shift[]> {
    if (rows.length === 0) {
      return [];
    }

    // Gather references up front so the rest of the method can use cheap lookups.
    const shiftIds = rows.map((row) => row.shift.id);
    const cancelledByUserIds = [
      ...new Set(
        rows
          .map((row) => row.shift.cancelledByUserId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    const [
      effectiveVolunteersByShift,
      instructorIdsByShift,
      coverageRecords,
      attendanceRecords,
    ] = await Promise.all([
      getEffectiveVolunteerAssignmentsForShifts(this.db, shiftIds),
      getShiftInstructorAssignmentsForShifts(this.db, shiftIds),
      this.db
        .select({
          id: coverageRequest.id,
          shiftId: coverageRequest.shiftId,
          requestedAt: coverageRequest.requestedAt,
          status: coverageRequest.status,
          category: coverageRequest.category,
          details: coverageRequest.details,
          comments: coverageRequest.comments,
          requestingVolunteerUserId: coverageRequest.requestingVolunteerUserId,
          coveredByVolunteerUserId: coverageRequest.coveredByVolunteerUserId,
        })
        .from(coverageRequest)
        .where(inArray(coverageRequest.shiftId, shiftIds)),
      this.db
        .select({
          shiftId: shiftAttendance.shiftId,
          userId: shiftAttendance.userId,
          status: shiftAttendance.status,
          checkedInAt: shiftAttendance.checkedInAt,
          minutesWorked: shiftAttendance.minutesWorked,
        })
        .from(shiftAttendance)
        .where(inArray(shiftAttendance.shiftId, shiftIds)),
    ]);

    const neededVolunteerIds = new Set<string>();
    for (const assignments of effectiveVolunteersByShift.values()) {
      for (const assignment of assignments) {
        neededVolunteerIds.add(assignment.volunteerUserId);
        if (assignment.coveringForVolunteerUserId) {
          neededVolunteerIds.add(assignment.coveringForVolunteerUserId);
        }
      }
    }
    for (const record of coverageRecords) {
      neededVolunteerIds.add(record.requestingVolunteerUserId);
      if (record.coveredByVolunteerUserId) {
        neededVolunteerIds.add(record.coveredByVolunteerUserId);
      }
    }
    for (const attendance of attendanceRecords) {
      neededVolunteerIds.add(attendance.userId);
    }

    const neededInstructorIds = [
      ...new Set(Array.from(instructorIdsByShift.values()).flat()),
    ];

    const [volunteerRows, instructorRows, cancelledByUsers] = await Promise.all(
      [
        neededVolunteerIds.size > 0
          ? this.db
              .select({
                volunteer: getViewSelectedFields(volunteerUserView),
              })
              .from(volunteerUserView)
              .where(
                inArray(volunteerUserView.id, Array.from(neededVolunteerIds)),
              )
          : Promise.resolve([]),
        neededInstructorIds.length > 0
          ? this.db
              .select({
                instructor: getViewSelectedFields(instructorUserView),
              })
              .from(instructorUserView)
              .where(inArray(instructorUserView.id, neededInstructorIds))
          : Promise.resolve([]),
        cancelledByUserIds.length > 0
          ? this.db
              .select()
              .from(user)
              .where(inArray(user.id, cancelledByUserIds))
          : Promise.resolve([]),
      ],
    );

    const volunteersById = new Map<string, ReturnType<typeof buildVolunteer>>();
    for (const row of volunteerRows) {
      const volunteerModel = buildVolunteer(row.volunteer);
      volunteersById.set(volunteerModel.id, volunteerModel);
    }

    const instructorsById = new Map<string, ReturnType<typeof buildUser>>();
    for (const row of instructorRows) {
      const instructorModel = buildUser(row.instructor);
      instructorsById.set(instructorModel.id, instructorModel);
    }

    const cancelledByUsersById = new Map(
      cancelledByUsers.map((u) => [u.id, buildUser(u)] as const),
    );
    // Create a dense map keyed by shift + volunteer to speed up lookups below.
    const attendanceByShiftUser = new Map<
      string,
      {
        shiftId: string;
        volunteerUserId: string;
        status: (typeof attendanceRecords)[number]["status"];
        checkedInAt: Date | null;
        minutesWorked: number | null;
      }
    >();
    for (const record of attendanceRecords) {
      const key = `${record.shiftId}:${record.userId}`;
      attendanceByShiftUser.set(key, {
        shiftId: record.shiftId,
        volunteerUserId: record.userId,
        status: record.status,
        checkedInAt: record.checkedInAt,
        minutesWorked: record.minutesWorked,
      });
    }

    // Group every coverage request with its shift so we can hydrate in one pass.
    const coverageByShift = new Map<string, Shift["coverageRequests"]>();
    for (const record of coverageRecords) {
      const requestingVolunteer = volunteersById.get(
        record.requestingVolunteerUserId,
      );
      if (!requestingVolunteer) {
        throw new NeuronError(
          `Requesting volunteer ${record.requestingVolunteerUserId} not found for coverage ${record.id}`,
          NeuronErrorCodes.NOT_FOUND,
        );
      }

      const coveredVolunteer = record.coveredByVolunteerUserId
        ? (volunteersById.get(record.coveredByVolunteerUserId) ?? null)
        : null;

      const shiftCoverage = {
        id: record.id,
        shiftId: record.shiftId,
        requestedAt: record.requestedAt,
        status: record.status,
        category: record.category,
        details: record.details,
        comments: record.comments,
        requestingVolunteer,
        coveredByVolunteer: coveredVolunteer,
      };

      const coveragesForShift =
        coverageByShift.get(record.shiftId) ??
        ([] as Shift["coverageRequests"]);
      coveragesForShift.push(shiftCoverage);
      coverageByShift.set(record.shiftId, coveragesForShift);
    }

    return rows.map((row) => {
      const effectiveAssignments =
        effectiveVolunteersByShift.get(row.shift.id) ?? [];
      const coverageForShift = sortCoverageRequestsByStatus(
        coverageByShift.get(row.shift.id) ?? [],
      );
      const cancelledByUser = row.shift.cancelledByUserId
        ? cancelledByUsersById.get(row.shift.cancelledByUserId)
        : undefined;

      const roster: Shift["volunteers"] = [];
      for (const assignment of effectiveAssignments) {
        const volunteer = volunteersById.get(assignment.volunteerUserId);
        if (!volunteer) continue;

        const coveringFor = assignment.coveringForVolunteerUserId
          ? volunteersById.get(assignment.coveringForVolunteerUserId)
          : undefined;
        const attendance =
          attendanceByShiftUser.get(`${row.shift.id}:${volunteer.id}`) ??
          undefined;

        roster.push({
          ...volunteer,
          ...(coveringFor ? { coveringFor } : {}),
          attendance,
        });
      }

      const instructors = (instructorIdsByShift.get(row.shift.id) ?? [])
        .map((id) => instructorsById.get(id))
        .filter((i): i is ReturnType<typeof buildUser> => Boolean(i));

      return buildShift(
        row.shift,
        row.course,
        cancelledByUser,
        instructors,
        roster,
        coverageForShift,
      );
    });
  }

  private canSeeUnpublishedTerms(): boolean {
    const user = this.currentSessionService.getUser();
    if (!user) return false;
    return hasPermission({
      user,
      permission: { terms: ["view-unpublished"] },
    });
  }

  private async loadShiftModels(
    ...whereClauses: (SQL<unknown> | undefined)[]
  ): Promise<Shift[]> {
    if (!this.canSeeUnpublishedTerms()) {
      whereClauses.push(eq(term.published, true));
    }

    const rows: ShiftRow[] = await this.db
      .select({
        shift: shift,
        course: course,
        schedule: schedule,
      })
      .from(shift)
      .innerJoin(course, eq(shift.courseId, course.id))
      .innerJoin(schedule, eq(shift.scheduleId, schedule.id))
      .innerJoin(term, eq(course.termId, term.id))
      .where(and(...whereClauses))
      .orderBy(shift.startAt);

    return this.hydrateShiftRows(rows);
  }

  async checkIn(
    shiftId: string,
    volunteerId: string,
  ): Promise<ShiftAttendanceSummary> {
    const session = this.currentSessionService.requireSession();
    const hasOverride = hasPermission({
      user: session.user,
      permission: { shifts: ["override-check-in"] },
    });
    const canSeeUnpublished = this.canSeeUnpublishedTerms();

    return this.db.transaction(async (tx) => {
      // Lock the shift row so check-in serializes against shift cancellation
      // and coverage assignment transitions.
      const [lockedShift] = await tx
        .select({
          id: shift.id,
          courseId: shift.courseId,
          startAt: shift.startAt,
          canceled: shift.canceled,
        })
        .from(shift)
        .where(eq(shift.id, shiftId))
        .for("update");

      if (!lockedShift) {
        throw new NeuronError(
          `Shift with id ${shiftId} was not found`,
          NeuronErrorCodes.NOT_FOUND,
        );
      }

      if (!canSeeUnpublished) {
        const [publishedRow] = await tx
          .select({ published: term.published })
          .from(course)
          .innerJoin(term, eq(course.termId, term.id))
          .where(eq(course.id, lockedShift.courseId))
          .limit(1);

        if (!publishedRow?.published) {
          throw new NeuronError(
            `Shift with id ${shiftId} was not found`,
            NeuronErrorCodes.NOT_FOUND,
          );
        }
      }

      if (lockedShift.canceled) {
        throw new NeuronError(
          "Cannot check in to a canceled shift",
          NeuronErrorCodes.BAD_REQUEST,
        );
      }

      const isAssigned = await isVolunteerEffectivelyAssignedToShift(
        tx,
        shiftId,
        volunteerId,
      );

      if (!isAssigned) {
        throw new NeuronError(
          "Volunteer is not assigned to this shift",
          NeuronErrorCodes.FORBIDDEN,
        );
      }

      const now = new Date();
      const checkInTime = now.getTime();
      const shiftStart = lockedShift.startAt.getTime();
      const fifteenMinutes = 15 * 60 * 1000;
      const thirtyMinutes = 30 * 60 * 1000;

      const earliestOnTime = shiftStart - fifteenMinutes;
      const latestOnTime = shiftStart + fifteenMinutes;
      const latestLate = shiftStart + thirtyMinutes;

      let attendanceStatus: AttendanceStatus;

      if (checkInTime >= earliestOnTime && checkInTime <= latestOnTime) {
        attendanceStatus = AttendanceStatus.present;
      } else if (checkInTime > latestOnTime && checkInTime <= latestLate) {
        attendanceStatus = AttendanceStatus.late;
      } else {
        if (!hasOverride) {
          throw new NeuronError(
            "Check-in is not allowed at this time",
            NeuronErrorCodes.FORBIDDEN,
          );
        }

        attendanceStatus = AttendanceStatus.excused;
      }

      const [attendance] = await tx
        .insert(shiftAttendance)
        .values({
          shiftId: shiftId,
          userId: volunteerId,
          status: attendanceStatus,
          checkedInAt: now,
        })
        .onConflictDoUpdate({
          target: [shiftAttendance.shiftId, shiftAttendance.userId],
          set: {
            status: attendanceStatus,
            checkedInAt: now,
          },
        })
        .returning({
          status: shiftAttendance.status,
          checkedInAt: shiftAttendance.checkedInAt,
          minutesWorked: shiftAttendance.minutesWorked,
        });

      return {
        shiftId,
        volunteerUserId: volunteerId,
        status: attendance?.status ?? attendanceStatus,
        checkedInAt: attendance?.checkedInAt ?? now,
        minutesWorked: attendance?.minutesWorked ?? undefined,
      };
    });
  }

  async listWindow(input: GetShiftsInput): Promise<{
    cursor: string;
    shifts: ListShiftView[];
    nextCursor: string;
    prevCursor: string;
  }> {
    const { cursor, userId, courseId, scheduleId } = input;
    const {
      cursor: normalizedCursor,
      windowStart,
      windowEnd,
      prevCursor,
      nextCursor,
    } = this.resolveMonthWindow(cursor);

    const conditions: (SQL<unknown> | undefined)[] = [
      gte(shift.startAt, windowStart),
      lte(shift.startAt, windowEnd),
    ];

    if (courseId) {
      conditions.push(eq(shift.courseId, courseId));
    }

    if (scheduleId) {
      conditions.push(eq(shift.scheduleId, scheduleId));
    }

    const viewer = await this.getViewer(userId);

    if (viewer) {
      const canViewAll = hasPermission({
        role: viewer.role,
        permission: { shifts: ["view-all"] },
      });
      const canCheckIn = hasPermission({
        role: viewer.role,
        permission: { shifts: ["check-in"] },
      });

      if (!canViewAll && canCheckIn) {
        conditions.push(this.buildVolunteerVisibilityCondition(viewer.id));
      } else if (!canViewAll && !canCheckIn) {
        conditions.push(this.buildInstructorVisibilityCondition(viewer.id));
      }
    }

    const shiftModels = await this.loadShiftModels(...conditions);

    return {
      cursor: normalizedCursor,
      shifts: shiftModels.map((shiftModel) => {
        if (viewer) {
          const canViewAll = hasPermission({
            role: viewer.role,
            permission: { shifts: ["view-all"] },
          });
          const canCheckIn = hasPermission({
            role: viewer.role,
            permission: { shifts: ["check-in"] },
          });

          if (canViewAll) {
            return getListShiftWithRosterStatus(shiftModel);
          }
          if (canCheckIn) {
            return getListShiftWithPersonalStatus(shiftModel, viewer.id);
          }
        }

        return getListShift(shiftModel);
      }),
      nextCursor,
      prevCursor,
    };
  }

  async getShiftById(
    shiftId: string,
    userId: string,
  ): Promise<SingleShiftView> {
    const viewer = await this.getViewer(userId);

    const shiftModels = await this.loadShiftModels(eq(shift.id, shiftId));
    const shiftModel = shiftModels[0];

    if (!shiftModel) {
      throw new NeuronError(
        `Shift with id ${shiftId} was not found`,
        NeuronErrorCodes.NOT_FOUND,
      );
    }

    if (viewer) {
      const canViewAll = hasPermission({
        role: viewer.role,
        permission: { shifts: ["view-all"] },
      });
      const canCheckIn = hasPermission({
        role: viewer.role,
        permission: { shifts: ["check-in"] },
      });

      if (canViewAll) {
        return getSingleShiftWithRosterContext(shiftModel);
      }
      if (canCheckIn) {
        return getSingleShiftWithPersonalContext(shiftModel, viewer.id);
      }
    }

    return getSingleShift(shiftModel);
  }

  async getShiftsByIds(shiftIds: string[]): Promise<Shift[]> {
    if (shiftIds.length === 0) return [];
    return this.loadShiftModels(inArray(shift.id, shiftIds));
  }

  async createShift(
    input: CreateShiftInput,
    tx?: Transaction,
  ): Promise<string> {
    const transaction = tx ?? this.db;

    const scheduleRow = await transaction.query.schedule.findFirst({
      where: eq(schedule.id, input.scheduleId),
      columns: {
        id: true,
        courseId: true,
      },
    });

    if (!scheduleRow) {
      throw new NeuronError(
        `Schedule with id ${input.scheduleId} was not found`,
        NeuronErrorCodes.NOT_FOUND,
      );
    }

    const startAt = new Date(input.startAt);
    const endAt = new Date(input.endAt);

    const [row] = await transaction
      .insert(shift)
      .values({
        courseId: scheduleRow.courseId,
        scheduleId: input.scheduleId,
        date: input.date,
        startAt,
        endAt,
      })
      .returning({ id: shift.id });

    const shiftId = row!.id;

    await snapshotScheduleAssignmentsToShift(
      transaction,
      shiftId,
      input.scheduleId,
    );

    // Schedule shift reminder (1 hour before start)
    const reminderAt = new Date(startAt.getTime() - 60 * 60 * 1000);
    if (reminderAt > new Date()) {
      void this.jobService.run(
        "jobs.check-shift-notifications",
        { shiftId, checkType: "reminder" },
        { startAfter: reminderAt },
      );
    }

    // Schedule no-checkin check (at shift end)
    if (endAt > new Date()) {
      void this.jobService.run(
        "jobs.check-shift-notifications",
        { shiftId, checkType: "no-checkin" },
        { startAfter: endAt },
      );
    }

    return shiftId;
  }

  async deleteShift(input: ShiftIdInput): Promise<void> {
    const [deletedRow] = await this.db
      .delete(shift)
      .where(eq(shift.id, input.shiftId))
      .returning({ id: shift.id });

    if (!deletedRow) {
      throw new NeuronError(
        `Shift with id ${input.shiftId} was not found`,
        NeuronErrorCodes.NOT_FOUND,
      );
    }
  }

  async cancelShift({
    shiftId,
    cancelReason,
  }: CancelShiftInput): Promise<void> {
    const currentUserId = this.currentSessionService.getUserId();

    const cancelledShift = await this.db.transaction(async (tx) => {
      const [lockedShift] = await tx
        .select({
          id: shift.id,
          courseId: shift.courseId,
          startAt: shift.startAt,
          canceled: shift.canceled,
        })
        .from(shift)
        .where(eq(shift.id, shiftId))
        .for("update");

      if (!lockedShift) {
        throw new NeuronError(
          `Shift with id ${shiftId} was not found`,
          NeuronErrorCodes.NOT_FOUND,
        );
      }

      if (lockedShift.startAt <= new Date()) {
        throw new NeuronError(
          "Cannot cancel a shift that has already started",
          NeuronErrorCodes.BAD_REQUEST,
        );
      }

      if (lockedShift.canceled) {
        return null;
      }

      const [updated] = await tx
        .update(shift)
        .set({
          canceled: true,
          cancelledByUserId: currentUserId ?? null,
          canceledAt: new Date(),
          cancelReason,
        })
        .where(and(eq(shift.id, shiftId), eq(shift.canceled, false)))
        .returning({ id: shift.id });

      if (!updated) {
        return null;
      }

      const [courseRow] = await tx
        .select({ name: course.name })
        .from(course)
        .where(eq(course.id, lockedShift.courseId))
        .limit(1);

      return {
        startAt: lockedShift.startAt,
        courseName: courseRow?.name ?? "",
      };
    });

    if (!cancelledShift) {
      return;
    }

    const currentUser = this.currentSessionService.getUser();
    void this.notificationEventService.notifyShiftCancelled({
      shiftId,
      className: cancelledShift.courseName,
      shiftDate: formatDate(cancelledShift.startAt),
      cancelReason,
      cancelledByUserId: currentUserId,
      cancelledByName: currentUser
        ? `${currentUser.name} ${currentUser.lastName}`
        : "System",
    });
  }

  async assertValidShift(
    volunteerId: string,
    shiftId: string,
    tx?: Transaction,
  ): Promise<void> {
    const transaction = tx ?? this.db;
    const [shiftRow] = await transaction
      .select({
        shiftId: shift.id,
        startAt: shift.startAt,
        canceled: shift.canceled,
      })
      .from(shift)
      .where(eq(shift.id, shiftId))
      .limit(1);

    if (
      !shiftRow ||
      !(await isVolunteerEffectivelyAssignedToShift(
        transaction,
        shiftId,
        volunteerId,
      ))
    ) {
      throw new NeuronError(
        `Could not find a shift with id ${shiftId} assigned to volunteer with id ${volunteerId}.`,
        NeuronErrorCodes.NOT_FOUND,
      );
    }

    if (shiftRow.canceled) {
      throw new NeuronError(
        "Coverage request can not be created for a canceled shift.",
        NeuronErrorCodes.BAD_REQUEST,
      );
    }

    if (shiftRow.startAt <= new Date()) {
      throw new NeuronError(
        "Coverage request can not be created for a past shift.",
        NeuronErrorCodes.BAD_REQUEST,
      );
    }
  }

  private formatCursor(date: Date): string {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    return `${year.toString().padStart(4, "0")}-${month
      .toString()
      .padStart(2, "0")}`;
  }

  private resolveMonthWindow(cursor: string): {
    cursor: string;
    windowStart: Date;
    windowEnd: Date;
    prevCursor: string;
    nextCursor: string;
  } {
    const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(cursor);
    if (!match) {
      throw new NeuronError(
        "Cursor must be in YYYY-MM format",
        NeuronErrorCodes.BAD_REQUEST,
      );
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const normalizedCursor = `${year.toString().padStart(4, "0")}-${month
      .toString()
      .padStart(2, "0")}`;

    const windowStart = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const windowEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const prevMonth = new Date(Date.UTC(year, month - 1, 1));
    prevMonth.setUTCMonth(prevMonth.getUTCMonth() - 1);
    const nextMonth = new Date(Date.UTC(year, month - 1, 1));
    nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);

    return {
      cursor: normalizedCursor,
      windowStart,
      windowEnd,
      prevCursor: this.formatCursor(prevMonth),
      nextCursor: this.formatCursor(nextMonth),
    };
  }
}
