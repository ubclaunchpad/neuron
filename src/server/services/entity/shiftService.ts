import type { CreateShiftInput, ShiftIdInput, GetShiftsInput, ShiftList, ShiftSingle } from "@/models/api/shift";
import { buildShift, type Shift } from "@/models/shift";
import { type Drizzle } from "@/server/db";
import { schedule } from "@/server/db/schema/schedule";
import { course } from "@/server/db/schema/course";
import { volunteer } from "@/server/db/schema/user";
import { shiftAttendance, shift, coverageRequest } from "@/server/db/schema/shift";
import { NeuronError, NeuronErrorCodes } from "@/server/errors/neuron-error";
import { CoverageStatus } from "@/models/interfaces";
import { and, asc, desc, eq, gte, lte, or, sql } from "drizzle-orm";

export class ShiftService {
  private readonly db: Drizzle;

  constructor(db: Drizzle) {
    this.db = db;
  }

  async createShift(input: CreateShiftInput): Promise<string> {
    const scheduleRow = await this.db.query.schedule.findFirst({
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

    const [row] = await this.db
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

  async getShifts(input: GetShiftsInput): Promise<{
    items: ShiftList[];
    nextCursor: string | null;
    prevCursor: string | null;
    hasMore: boolean;
  }> {
    const { 
      cursor, 
      limit, 
      direction, 
      userId, 
      startAfter, 
      startBefore,
      courseId,
      excludeCanceled,
      includeAttendanceInfo,
      includeCoverageInfo
    } = input;

    // Build WHERE conditions
    const conditions = [];

    if (excludeCanceled) {
      conditions.push(eq(shift.canceled, false));
    }

    if (startAfter) {
      conditions.push(gte(shift.startAt, startAfter));
    }

    if (startBefore) {
      conditions.push(lte(shift.startAt, startBefore));
    }

    if (courseId) {
      conditions.push(eq(shift.courseId, courseId));
    }

    // Cursor pagination
    if (cursor) {
      if (direction === "forward") {
        conditions.push(sql`${shift.startAt} > (SELECT start_at FROM ${shift} WHERE id = ${cursor})`);
      } else {
        conditions.push(sql`${shift.startAt} < (SELECT start_at FROM ${shift} WHERE id = ${cursor})`);
      }
    }

    // Base query - we'll use CTEs for complex user filtering
    let query;

    if (userId) {
      // Check if user is a volunteer
      const [volunteerRecord] = await this.db
        .select({ userId: volunteer.userId })
        .from(volunteer)
        .where(eq(volunteer.userId, userId))
        .limit(1);

      const isVolunteer = !!volunteerRecord;

      if (isVolunteer) {
        // For volunteers: get shifts where they're assigned OR covering
        query = this.db
          .selectDistinct({
            id: shift.id,
            courseId: shift.courseId,
            courseName: course.name,
            scheduleId: shift.scheduleId,
            startAt: shift.startAt,
            endAt: shift.endAt,
            date: shift.date,
            canceled: shift.canceled,
            cancelReason: shift.cancelReason,
            canceledAt: shift.canceledAt,
          })
          .from(shift)
          .innerJoin(course, eq(shift.courseId, course.id))
          .leftJoin(
            shiftAttendance,
            and(
              eq(shift.id, shiftAttendance.shiftId),
              eq(shiftAttendance.userId, userId)
            )
          )
          .leftJoin(
            coverageRequest,
            and(
              eq(shift.id, coverageRequest.shiftId),
              eq(coverageRequest.coveredByVolunteerUserId, userId),
              eq(coverageRequest.status, CoverageStatus.resolved)
            )
          )
          .where(
            and(
              ...conditions,
              or(
                // Has attendance record
                eq(shiftAttendance.userId, userId),
                // Is covering via completed coverage request
                eq(coverageRequest.coveredByVolunteerUserId, userId)
              )
            )
          );
      } else {
        // User is not a volunteer, check if they're an instructor for any courses
        query = this.db
          .select({
            id: shift.id,
            courseId: shift.courseId,
            courseName: course.name,
            scheduleId: shift.scheduleId,
            startAt: shift.startAt,
            endAt: shift.endAt,
            date: shift.date,
            canceled: shift.canceled,
            cancelReason: shift.cancelReason,
            canceledAt: shift.canceledAt,
          })
          .from(shift)
          .innerJoin(course, eq(shift.courseId, course.id))
          .where(
            and(
              ...conditions,
              eq(course.instructorUserId, userId)
            )
          );
      }
    } else {
      // No user filter - get all shifts
      query = this.db
        .select({
          id: shift.id,
          courseId: shift.courseId,
          courseName: course.name,
          scheduleId: shift.scheduleId,
          startAt: shift.startAt,
          endAt: shift.endAt,
          date: shift.date,
          canceled: shift.canceled,
          cancelReason: shift.cancelReason,
          canceledAt: shift.canceledAt,
        })
        .from(shift)
        .innerJoin(course, eq(shift.courseId, course.id))
        .where(and(...conditions));
    }

    // Apply ordering and limit
    const orderByClause = direction === "forward" 
      ? asc(shift.startAt) 
      : desc(shift.startAt);
    
    query = query.orderBy(orderByClause).limit(limit + 1); // Fetch one extra to check for more

    const results = await query;

    // Check if there are more results
    const hasMore = results.length > limit;
    const items = hasMore ? results.slice(0, limit) : results;

    // Calculate cursors
    const nextCursor = hasMore && direction === "forward" 
      ? items[items.length - 1]?.id ?? null
      : null;
    
    const prevCursor = cursor && direction === "backward"
      ? items[0]?.id ?? null
      : null;

    // Optionally fetch additional info
    const enrichedItems: ShiftList[] = [];
    
    for (const item of items) {
      const enriched: ShiftList = {
        ...item,
        courseName: item.courseName,
      };

      if (includeAttendanceInfo) {
        const attendanceCount = await this.db
          .select({ count: sql<number>`count(*)` })
          .from(shiftAttendance)
          .where(eq(shiftAttendance.shiftId, item.id));
        
        enriched.attendanceCount = Number(attendanceCount[0]?.count ?? 0);
      }

      if (includeCoverageInfo) {
        const [openCoverage] = await this.db
          .select({ id: coverageRequest.id })
          .from(coverageRequest)
          .where(
            and(
              eq(coverageRequest.shiftId, item.id),
              eq(coverageRequest.status, CoverageStatus.open)
            )
          )
          .limit(1);
        
        enriched.needsCoverage = !!openCoverage;
      }

      if (userId) {
        // Get user's attendance status for this shift
        const [userAttendance] = await this.db
          .select({ status: shiftAttendance.status })
          .from(shiftAttendance)
          .where(
            and(
              eq(shiftAttendance.shiftId, item.id),
              eq(shiftAttendance.userId, userId)
            )
          )
          .limit(1);
        
        enriched.userAttendanceStatus = userAttendance?.status ?? null;

        // Get user's coverage request for this shift
        const [userCoverage] = await this.db
          .select({
            id: coverageRequest.id,
            category: coverageRequest.category,
            status: coverageRequest.status,
            requestingVolunteerUserId: coverageRequest.requestingVolunteerUserId,
            coveredByVolunteerUserId: coverageRequest.coveredByVolunteerUserId,
            details: coverageRequest.details,
          })
          .from(coverageRequest)
          .where(
            and(
              eq(coverageRequest.shiftId, item.id),
              or(
                eq(coverageRequest.requestingVolunteerUserId, userId),
                eq(coverageRequest.coveredByVolunteerUserId, userId)
              )
            )
          )
          .limit(1);
        
        enriched.userCoverageRequest = userCoverage ?? null;
      }

      enrichedItems.push(enriched);
    }

    return {
      items: enrichedItems,
      nextCursor,
      prevCursor,
      hasMore,
    };
  }

  /**
   * Get a single shift with full details
   */
  async getShift(id: string): Promise<ShiftSingle | null> {
    const [shiftResult] = await this.db
      .select({
        id: shift.id,
        courseId: shift.courseId,
        scheduleId: shift.scheduleId,
        startAt: shift.startAt,
        endAt: shift.endAt,
        date: shift.date,
        canceled: shift.canceled,
        cancelReason: shift.cancelReason,
        canceledAt: shift.canceledAt,
        courseData: {
          id: course.id,
          name: course.name,
          description: course.description,
        },
        scheduleData: {
          id: schedule.id,
          durationMinutes: schedule.durationMinutes,
          effectiveStart: schedule.effectiveStart,
          effectiveEnd: schedule.effectiveEnd,
        },
      })
      .from(shift)
      .innerJoin(course, eq(shift.courseId, course.id))
      .innerJoin(schedule, eq(shift.scheduleId, schedule.id))
      .where(eq(shift.id, id))
      .limit(1);

    if (!shiftResult) {
      return null;
    }

    // Fetch coverage requests
    const coverageRequests = await this.db
      .select({
        id: coverageRequest.id,
        category: coverageRequest.category,
        status: coverageRequest.status,
        requestingVolunteerUserId: coverageRequest.requestingVolunteerUserId,
        coveredByVolunteerUserId: coverageRequest.coveredByVolunteerUserId,
        details: coverageRequest.details,
      })
      .from(coverageRequest)
      .where(eq(coverageRequest.shiftId, id));

    // Fetch attendance
    const attendance = await this.db
      .select({
        userId: shiftAttendance.userId,
        status: shiftAttendance.status,
        checkedInAt: shiftAttendance.checkedInAt,
        minutesWorked: shiftAttendance.minutesWorked,
      })
      .from(shiftAttendance)
      .where(eq(shiftAttendance.shiftId, id));

    const result: ShiftSingle = {
      id: shiftResult.id,
      courseId: shiftResult.courseId,
      scheduleId: shiftResult.scheduleId,
      startAt: shiftResult.startAt,
      endAt: shiftResult.endAt,
      date: shiftResult.date,
      canceled: shiftResult.canceled,
      cancelReason: shiftResult.cancelReason,
      canceledAt: shiftResult.canceledAt,
      course: shiftResult.courseData,
      schedule: shiftResult.scheduleData,
      coverageRequests,
      attendance,
    };

    return result;
  }
}
