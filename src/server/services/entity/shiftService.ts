import type { CreateShiftInput, GetShiftsInput, ShiftIdInput } from "@/models/api/shift";
import { buildClass } from "@/models/class";
import { buildInstructor } from "@/models/instructor";
import { buildSchedule, type ScheduleRule } from "@/models/schedule";
import { buildShift, getListShift, type ListShift } from "@/models/shift";
import { buildVolunteer } from "@/models/volunteer";
import { type Drizzle, type Transaction } from "@/server/db";
import { course } from "@/server/db/schema/course";
import { instructorToSchedule, schedule } from "@/server/db/schema/schedule";
import { coverageRequest, shift, shiftAttendance } from "@/server/db/schema/shift";
import { instructorUserView, volunteer, volunteerUserView } from "@/server/db/schema/user";
import { NeuronError, NeuronErrorCodes } from "@/server/errors/neuron-error";
import { and, eq, gte, lte, or, sql } from "drizzle-orm";

export class ShiftService {
  private readonly db: Drizzle;

  constructor(db: Drizzle) {
    this.db = db;
  }

  async getShifts(input: GetShiftsInput): Promise<{
    items: ListShift[];
    nextCursor: string | null;
    prevCursor: string | null;
  }> {
    const { userId, before, after, limit, cursor, direction } = input;

    // Build WHERE conditions
    const conditions = [eq(shift.canceled, false)];

    // Date range filtering
    if (before) {
      conditions.push(lte(shift.startAt, new Date(before)));
    }
    if (after) {
      conditions.push(gte(shift.startAt, new Date(after)));
    }

    // Cursor-based pagination
    if (cursor) {
      if (direction === "forward") {
        conditions.push(gte(shift.startAt, new Date(cursor)));
      } else {
        conditions.push(lte(shift.startAt, new Date(cursor)));
      }
    }

    let userFilterSql = null;
    if (userId) {
      const [volunteerRow] = await this.db
        .select({ userId: volunteer.userId })
        .from(volunteer)
        .where(eq(volunteer.userId, userId))
        .limit(1);

      const [instructorRow] = await this.db
        .select({ id: instructorUserView.id })
        .from(instructorUserView)
        .where(eq(instructorUserView.id, userId))
        .limit(1);

      if (volunteerRow) {
        // For volunteers: check shift_attendance OR resolved coverage requests
        userFilterSql = or(
          sql`EXISTS (
            SELECT 1 FROM ${shiftAttendance}
            WHERE ${shiftAttendance.shiftId} = ${shift.id}
            AND ${shiftAttendance.userId} = ${userId}
          )`,
          sql`EXISTS (
            SELECT 1 FROM ${coverageRequest}
            WHERE ${coverageRequest.shiftId} = ${shift.id}
            AND ${coverageRequest.coveredByVolunteerUserId} = ${userId}
            AND ${coverageRequest.status} = 'resolved'
          )`
        );
      } else if (instructorRow) {
        userFilterSql = sql`EXISTS (
          SELECT 1 FROM ${instructorToSchedule}
          WHERE ${instructorToSchedule.scheduleId} = ${shift.scheduleId}
          AND ${instructorToSchedule.instructorUserId} = ${userId}
        )`;
      }

      if (userFilterSql) {
        conditions.push(userFilterSql);
      }
    }

    const shifts = await this.db
      .select({
        shift: shift,
        course: course,
        schedule: schedule,
      })
      .from(shift)
      .innerJoin(course, eq(shift.courseId, course.id))
      .innerJoin(schedule, eq(shift.scheduleId, schedule.id))
      .where(and(...conditions))
      .orderBy(direction === "forward" ? shift.startAt : sql`${shift.startAt} DESC`)
      .limit(limit + 1); // Fetch one extra to determine if there's a next page

    const hasMore = shifts.length > limit;
    const items = shifts.slice(0, limit);

    const shiftIds = items.map((s) => s.shift.id);

    if (shiftIds.length === 0) {
      return {
        items: [],
        nextCursor: null,
        prevCursor: null,
      };
    }

    const attendanceRecords = await this.db
      .select({
        shiftId: shiftAttendance.shiftId,
        user: {
          id: volunteerUserView.id,
          name: volunteerUserView.name,
          lastName: volunteerUserView.lastName,
          email: volunteerUserView.email,
          status: volunteerUserView.status,
          createdAt: volunteerUserView.createdAt,
          updatedAt: volunteerUserView.updatedAt,
          emailVerified: volunteerUserView.emailVerified,
          image: volunteerUserView.image,
          role: volunteerUserView.role,
          preferredName: volunteerUserView.preferredName,
          bio: volunteerUserView.bio,
          pronouns: volunteerUserView.pronouns,
          phoneNumber: volunteerUserView.phoneNumber,
          city: volunteerUserView.city,
          province: volunteerUserView.province,
          availability: volunteerUserView.availability,
          preferredTimeCommitmentHours: volunteerUserView.preferredTimeCommitmentHours,
        },
      })
      .from(shiftAttendance)
      .innerJoin(volunteerUserView, eq(shiftAttendance.userId, volunteerUserView.id))
      .where(sql`${shiftAttendance.shiftId} = ANY(${shiftIds})`);

    const coverageRecords = await this.db
      .select({
        shiftId: coverageRequest.shiftId,
        coveringUser: {
          id: volunteerUserView.id,
          name: volunteerUserView.name,
          lastName: volunteerUserView.lastName,
          email: volunteerUserView.email,
          status: volunteerUserView.status,
          createdAt: volunteerUserView.createdAt,
          updatedAt: volunteerUserView.updatedAt,
          emailVerified: volunteerUserView.emailVerified,
          image: volunteerUserView.image,
          role: volunteerUserView.role,
          preferredName: volunteerUserView.preferredName,
          bio: volunteerUserView.bio,
          pronouns: volunteerUserView.pronouns,
          phoneNumber: volunteerUserView.phoneNumber,
          city: volunteerUserView.city,
          province: volunteerUserView.province,
          availability: volunteerUserView.availability,
          preferredTimeCommitmentHours: volunteerUserView.preferredTimeCommitmentHours,
        },
      })
      .from(coverageRequest)
      .innerJoin(volunteer, eq(coverageRequest.coveredByVolunteerUserId, volunteer.userId))
      .innerJoin(volunteerUserView, eq(volunteer.userId, volunteerUserView.id))
      .where(
        and(
          sql`${coverageRequest.shiftId} = ANY(${shiftIds})`,
          eq(coverageRequest.status, "resolved")
        )
      );

    // Get instructors for schedules (many-to-many relationship)
    const scheduleIds = [...new Set(items.map((s) => s.schedule.id))];
    const instructorRecords = await this.db
      .select({
        scheduleId: instructorToSchedule.scheduleId,
        instructor: {
          id: instructorUserView.id,
          name: instructorUserView.name,
          lastName: instructorUserView.lastName,
          email: instructorUserView.email,
          status: instructorUserView.status,
          createdAt: instructorUserView.createdAt,
          updatedAt: instructorUserView.updatedAt,
          image: instructorUserView.image,
          role: instructorUserView.role,
          emailVerified: instructorUserView.emailVerified,
        },
      })
      .from(instructorToSchedule)
      .innerJoin(instructorUserView, eq(instructorToSchedule.instructorUserId, instructorUserView.id))
      .where(sql`${instructorToSchedule.scheduleId} = ANY(${scheduleIds})`);

    // Map to attendance by shift
    const attendanceByShift = new Map<string, Array<typeof attendanceRecords[0]["user"]>>();
    for (const record of attendanceRecords) {
      const volunteers = attendanceByShift.get(record.shiftId) || [];
      volunteers.push(record.user);
      attendanceByShift.set(record.shiftId, volunteers);
    }

    // Map coverage by shift
    const coverageByShift = new Map<string, typeof coverageRecords[0]["coveringUser"]>();
    for (const record of coverageRecords) {
      coverageByShift.set(record.shiftId, record.coveringUser);
    }

    // Map instructors by schedule (can be multiple instructors per schedule)
    const instructorsBySchedule = new Map<string, Array<typeof instructorRecords[0]["instructor"]>>();
    for (const record of instructorRecords) {
      const instructors = instructorsBySchedule.get(record.scheduleId) || [];
      instructors.push(record.instructor);
      instructorsBySchedule.set(record.scheduleId, instructors);
    }

    const result: ListShift[] = items.map((item) => {
      const volunteers = (attendanceByShift.get(item.shift.id) || []).map(buildVolunteer);
      const coveringVolunteer = coverageByShift.has(item.shift.id)
        ? buildVolunteer(coverageByShift.get(item.shift.id)!)
        : undefined;

      const instructorDBs = instructorsBySchedule.get(item.schedule.id) || [];
      const instructors = instructorDBs.map(buildInstructor);

      const scheduleRule = item.schedule.rrule as unknown as ScheduleRule;
      const scheduleModel = buildSchedule(
        item.schedule,
        scheduleRule,
        instructors,
        [] 
      );

      const classModel = buildClass(item.course, [scheduleModel]);

      const shiftModel = buildShift(
        item.shift,
        classModel,
        scheduleModel,
        volunteers,
        coveringVolunteer
      );

      return getListShift(shiftModel);
    });

    // Calculate cursors
    const nextCursor =
      hasMore && items.length > 0
        ? items[items.length - 1]!.shift.startAt.toISOString()
        : null;

    const prevCursor = items.length > 0 ? items[0]!.shift.startAt.toISOString() : null;

    return {
      items: result,
      nextCursor,
      prevCursor,
    };
  }

  async createShift(input: CreateShiftInput, tx?: Transaction): Promise<string> {
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
        NeuronErrorCodes.NOT_FOUND
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
}
