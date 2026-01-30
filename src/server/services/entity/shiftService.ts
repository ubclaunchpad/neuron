import type { Session } from "@/lib/auth";
import { hasPermission } from "@/lib/auth/extensions/permissions";
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
import { getViewColumns } from "@/server/db/extensions/get-view-columns";
import { course, type CourseDB } from "@/server/db/schema/course";
import {
  instructorToSchedule,
  schedule,
  type ScheduleDB,
  volunteerToSchedule,
} from "@/server/db/schema/schedule";
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
import { and, eq, gte, inArray, lte, or, sql, type SQL } from "drizzle-orm";

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
  createShift(input: CreateShiftInput, tx?: Transaction): Promise<string>;
  deleteShift(input: ShiftIdInput): Promise<void>;
  cancelShift(input: CancelShiftInput): Promise<void>;
  assertValidShift(volunteerId: string, shiftId: string): Promise<void>;
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
  private readonly session: Session;

  constructor(db: Drizzle, session: Session) {
    this.db = db;
    this.session = session;
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
      sql`EXISTS (
        SELECT 1 FROM ${volunteerToSchedule}
        WHERE ${volunteerToSchedule.scheduleId} = ${shift.scheduleId}
        AND ${volunteerToSchedule.volunteerUserId} = ${userId}
      )`,
      sql`EXISTS (
        SELECT 1 FROM ${coverageRequest}
        WHERE ${coverageRequest.shiftId} = ${shift.id}
        AND ${coverageRequest.requestingVolunteerUserId} = ${userId}
      )`,
      sql`EXISTS (
        SELECT 1 FROM ${coverageRequest}
        WHERE ${coverageRequest.shiftId} = ${shift.id}
        AND ${coverageRequest.coveredByVolunteerUserId} = ${userId}
        AND ${coverageRequest.status} = ${CoverageStatus.resolved}
      )`,
    );
  }

  private buildInstructorVisibilityCondition(userId: string): SQL<unknown> {
    return sql`EXISTS (
      SELECT 1 FROM ${instructorToSchedule}
      WHERE ${instructorToSchedule.scheduleId} = ${shift.scheduleId}
      AND ${instructorToSchedule.instructorUserId} = ${userId}
    )`;
  }

  private async hydrateShiftRows(rows: ShiftRow[]): Promise<Shift[]> {
    if (rows.length === 0) {
      return [];
    }

    // Gather references up front so the rest of the method can use cheap lookups.
    const shiftIds = rows.map((row) => row.shift.id);
    const scheduleIds = [...new Set(rows.map((s) => s.schedule.id))];
    const cancelledByUserIds = [
      ...new Set(
        rows
          .map((row) => row.shift.cancelledByUserId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    // Pull the latest roster assignments per schedule to avoid per-row queries.
    const volunteerAssignments = await this.db
      .select({
        scheduleId: volunteerToSchedule.scheduleId,
        volunteer: getViewColumns(volunteerUserView),
      })
      .from(volunteerToSchedule)
      .innerJoin(
        volunteerUserView,
        eq(volunteerToSchedule.volunteerUserId, volunteerUserView.id),
      )
      .where(inArray(volunteerToSchedule.scheduleId, scheduleIds));

    const coverageRecords = await this.db
      .select({
        id: coverageRequest.id,
        shiftId: coverageRequest.shiftId,
        status: coverageRequest.status,
        category: coverageRequest.category,
        details: coverageRequest.details,
        comments: coverageRequest.comments,
        requestingVolunteerUserId: coverageRequest.requestingVolunteerUserId,
        coveredByVolunteerUserId: coverageRequest.coveredByVolunteerUserId,
      })
      .from(coverageRequest)
      .where(inArray(coverageRequest.shiftId, shiftIds));

    const attendanceRecords = await this.db
      .select({
        shiftId: shiftAttendance.shiftId,
        userId: shiftAttendance.userId,
        status: shiftAttendance.status,
        checkedInAt: shiftAttendance.checkedInAt,
        minutesWorked: shiftAttendance.minutesWorked,
      })
      .from(shiftAttendance)
      .where(inArray(shiftAttendance.shiftId, shiftIds));

    const instructorRecords = await this.db
      .select({
        scheduleId: instructorToSchedule.scheduleId,
        instructor: getViewColumns(instructorUserView),
      })
      .from(instructorToSchedule)
      .innerJoin(
        instructorUserView,
        eq(instructorToSchedule.instructorUserId, instructorUserView.id),
      )
      .where(inArray(instructorToSchedule.scheduleId, scheduleIds));

    // Only load cancel authors if at least one shift was cancelled.
    const cancelledByUsers = cancelledByUserIds.length
      ? await this.db
          .select()
          .from(user)
          .where(inArray(user.id, cancelledByUserIds))
      : [];
    const cancelledByUsersById = new Map(
      cancelledByUsers.map((u) => [u.id, buildUser(u)] as const),
    );

    // Build reusable maps so we can merge roster, attendance, and coverage data.
    const volunteersById = new Map<string, ReturnType<typeof buildVolunteer>>();
    const volunteersBySchedule = new Map<string, string[]>();
    for (const record of volunteerAssignments) {
      const volunteerModel = buildVolunteer(record.volunteer);
      volunteersById.set(volunteerModel.id, volunteerModel);
      const scheduleVolunteers =
        volunteersBySchedule.get(record.scheduleId) ?? [];
      scheduleVolunteers.push(volunteerModel.id);
      volunteersBySchedule.set(record.scheduleId, scheduleVolunteers);
    }

    // Coverage requests may reference volunteers not on the base schedule roster.
    const coverageVolunteerIds = new Set<string>();
    for (const record of coverageRecords) {
      coverageVolunteerIds.add(record.requestingVolunteerUserId);
      if (record.coveredByVolunteerUserId) {
        coverageVolunteerIds.add(record.coveredByVolunteerUserId);
      }
    }

    // Attendance rows similarly reference volunteers; capture everyone involved.
    const attendanceVolunteerIds = new Set(
      attendanceRecords.map((attendance) => attendance.userId),
    );

    const missingVolunteerIds = Array.from(
      new Set([...coverageVolunteerIds, ...attendanceVolunteerIds]),
    ).filter((id) => !volunteersById.has(id));

    if (missingVolunteerIds.length > 0) {
      const extraVolunteerRows = await this.db
        .select({
          volunteer: getViewColumns(volunteerUserView),
        })
        .from(volunteerUserView)
        .where(inArray(volunteerUserView.id, missingVolunteerIds));

      for (const row of extraVolunteerRows) {
        const volunteerModel = buildVolunteer(row.volunteer);
        volunteersById.set(volunteerModel.id, volunteerModel);
      }
    }

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

    const instructorsBySchedule = new Map<
      string,
      ReturnType<typeof buildUser>[]
    >();
    for (const record of instructorRecords) {
      const instructorsForSchedule =
        instructorsBySchedule.get(record.scheduleId) ?? [];
      instructorsForSchedule.push(buildUser(record.instructor));
      instructorsBySchedule.set(record.scheduleId, instructorsForSchedule);
    }

    return rows.map((row) => {
      // Start with the roster that comes directly from the schedule assignment.
      const baseVolunteerIds = volunteersBySchedule.get(row.schedule.id) ?? [];
      const coverageForShift = sortCoverageRequestsByStatus(
        coverageByShift.get(row.shift.id) ?? [],
      );
      const cancelledByUser = row.shift.cancelledByUserId
        ? cancelledByUsersById.get(row.shift.cancelledByUserId)
        : undefined;

      // Track volunteers by id so coverage replacements can override originals.
      const roster = new Map<string, Shift["volunteers"][number]>();

      for (const volunteerId of baseVolunteerIds) {
        const volunteer = volunteersById.get(volunteerId);
        if (!volunteer) continue;

        const attendance =
          attendanceByShiftUser.get(`${row.shift.id}:${volunteer.id}`) ??
          undefined;
        roster.set(volunteer.id, {
          ...volunteer,
          attendance,
        });
      }

      for (const coverage of coverageForShift) {
        if (
          coverage.status !== CoverageStatus.resolved ||
          !coverage.coveredByVolunteer
        ) {
          continue;
        }

        roster.delete(coverage.requestingVolunteer.id);

        const attendance =
          attendanceByShiftUser.get(
            `${row.shift.id}:${coverage.coveredByVolunteer.id}`,
          ) ?? undefined;
        const existing = roster.get(coverage.coveredByVolunteer.id);

        roster.set(coverage.coveredByVolunteer.id, {
          ...(existing ?? coverage.coveredByVolunteer),
          coveringFor: coverage.requestingVolunteer,
          attendance: attendance ?? existing?.attendance,
        });
      }

      const instructors = instructorsBySchedule.get(row.schedule.id) ?? [];

      return buildShift(
        row.shift,
        row.course,
        cancelledByUser,
        instructors,
        Array.from(roster.values()),
        coverageForShift,
      );
    });
  }

  private async loadShiftModels(
    whereClauses: (SQL<unknown> | undefined)[],
  ): Promise<Shift[]> {
    const rows: ShiftRow[] = await this.db
      .select({
        shift: shift,
        course: course,
        schedule: schedule,
      })
      .from(shift)
      .innerJoin(course, eq(shift.courseId, course.id))
      .innerJoin(schedule, eq(shift.scheduleId, schedule.id))
      .where(and(...whereClauses))
      .orderBy(shift.startAt);

    return this.hydrateShiftRows(rows);
  }

  async checkIn(
    shiftId: string,
    volunteerId: string,
  ): Promise<ShiftAttendanceSummary> {
    const hasOverride = hasPermission({
      user: this.session.user,
      permission: { shifts: ["override-check-in"] },
    });

    const [shiftModel] = await this.loadShiftModels([eq(shift.id, shiftId)]);

    if (!shiftModel) {
      throw new NeuronError(
        `Shift with id ${shiftId} was not found`,
        NeuronErrorCodes.NOT_FOUND,
      );
    }

    const rosterVolunteer = shiftModel.volunteers.find(
      (volunteer) => volunteer.id === volunteerId,
    );

    if (!rosterVolunteer) {
      throw new NeuronError(
        "Volunteer is not assigned to this shift",
        NeuronErrorCodes.FORBIDDEN,
      );
    }

    const now = new Date();
    const checkInTime = now.getTime();
    const shiftStart = shiftModel.startAt.getTime();
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

    const [attendance] = await this.db
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

    if (viewer?.role === Role.volunteer) {
      conditions.push(this.buildVolunteerVisibilityCondition(viewer.id));
    }

    if (viewer?.role === Role.instructor) {
      conditions.push(this.buildInstructorVisibilityCondition(viewer.id));
    }

    const shiftModels = await this.loadShiftModels(conditions);

    return {
      cursor: normalizedCursor,
      shifts: shiftModels.map((shiftModel) => {
        if (viewer?.role === Role.admin) {
          return getListShiftWithRosterStatus(shiftModel);
        }

        if (viewer?.role === Role.volunteer) {
          return getListShiftWithPersonalStatus(shiftModel, viewer.id);
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

    const shiftModels = await this.loadShiftModels([eq(shift.id, shiftId)]);
    const shiftModel = shiftModels[0];

    if (!shiftModel) {
      throw new NeuronError(
        `Shift with id ${shiftId} was not found`,
        NeuronErrorCodes.NOT_FOUND,
      );
    }

    if (viewer?.role === Role.admin) {
      return getSingleShiftWithRosterContext(shiftModel);
    }

    if (viewer?.role === Role.volunteer) {
      return getSingleShiftWithPersonalContext(shiftModel, viewer.id);
    }

    return getSingleShift(shiftModel);
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

    const [row] = await transaction
      .insert(shift)
      .values({
        courseId: scheduleRow.courseId,
        scheduleId: input.scheduleId,
        date: input.date,
        startAt: new Date(input.startAt),
        endAt: new Date(input.endAt),
      })
      .returning({ id: shift.id });

    return row!.id;
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
    const [shiftRow] = await this.db
      .select({
        id: shift.id,
        startAt: shift.startAt,
        canceled: shift.canceled,
      })
      .from(shift)
      .where(eq(shift.id, shiftId))
      .limit(1);

    if (!shiftRow) {
      throw new NeuronError(
        `Shift with id ${shiftId} was not found`,
        NeuronErrorCodes.NOT_FOUND,
      );
    }

    if (shiftRow.startAt <= new Date()) {
      throw new NeuronError(
        "Cannot cancel a shift that has already started",
        NeuronErrorCodes.BAD_REQUEST,
      );
    }

    if (shiftRow.canceled) {
      return;
    }

    const [updated] = await this.db
      .update(shift)
      .set({
        canceled: true,
        cancelledByUserId: this.session?.user?.id ?? null,
        canceledAt: new Date(),
        cancelReason,
      })
      .where(eq(shift.id, shiftId))
      .returning({ id: shift.id });

    if (!updated) {
      throw new NeuronError(
        `Failed to cancel shift with id ${shiftId}`,
        NeuronErrorCodes.BAD_REQUEST,
      );
    }
  }

  async assertValidShift(volunteerId: string, shiftId: string): Promise<void> {
    const [shiftRow] = await this.db
      .select({
        shiftId: shift.id,
        startAt: shift.startAt,
        volunteerId: volunteerToSchedule.volunteerUserId,
      })
      .from(shift)
      .innerJoin(
        volunteerToSchedule,
        eq(shift.scheduleId, volunteerToSchedule.scheduleId),
      )
      .where(
        and(
          eq(shift.id, shiftId),
          eq(volunteerToSchedule.volunteerUserId, volunteerId),
        ),
      )
      .limit(1);

    if (!shiftRow) {
      throw new NeuronError(
        `Could not find a shift with id ${shiftId} assigned to volunteer with id ${volunteerId}.`,
        NeuronErrorCodes.NOT_FOUND,
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
