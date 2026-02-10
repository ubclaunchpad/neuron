import {
  CoverageStatus,
  type CreateCoverageRequest,
  type ListCoverageRequestsInput,
} from "@/models/api/coverage";
import {
  buildCoverageRequest,
  getListCoverageRequestBase,
  getListCoverageRequestWithReason,
  type CoverageRequest,
  type ListCoverageRequestBase,
  type ListCoverageRequestWithReason,
} from "@/models/coverage";
import { Role } from "@/models/interfaces";
import type { EmbeddedShift } from "@/models/shift";
import { buildUser } from "@/models/user";
import { getEmbeddedVolunteer } from "@/models/volunteer";
import type { ListResponse } from "@/models/list-response";
import type { Drizzle } from "@/server/db";
import { course } from "@/server/db/schema/course";
import {
  coverageRequest,
  instructorToSchedule,
  shift,
  type CoverageRequestDB,
} from "@/server/db/schema";
import { volunteerToSchedule } from "@/server/db/schema/schedule";
import { instructorUserView } from "@/server/db/schema/user";
import { getViewColumns } from "@/server/db/extensions/get-view-columns";
import { NeuronError, NeuronErrorCodes } from "@/server/errors/neuron-error";
import { toMap, uniqueDefined } from "@/utils/arrayUtils";
import { getPagination } from "@/utils/searchUtils";
import { and, eq, gte, inArray, lte, or, sql, type SQL } from "drizzle-orm";
import type { IVolunteerService } from "./volunteerService";
import type { IShiftService } from "./shiftService";

export interface ICoverageService {
  getCoverageRequestsForShift(shiftId: string): Promise<CoverageRequest[]>;
  listCoverageRequests(
    input: ListCoverageRequestsInput,
    viewerUserId: string,
    viewerRole: Role,
  ): Promise<
    ListResponse<ListCoverageRequestBase | ListCoverageRequestWithReason>
  >;
  getCoverageRequestById(id: string): Promise<CoverageRequest>;
  getCoverageRequestByIds(ids: string[]): Promise<CoverageRequest[]>;
  createCoverageRequest(
    requestingVolunteerUserId: string,
    requestData: CreateCoverageRequest,
  ): Promise<string>;
  cancelCoverageRequest(
    requestingVolunteerUserId: string,
    coverageRequestId: string,
  ): Promise<void>;
  fulfillCoverageRequest(
    coveredByVolunteerUserId: string,
    coverageRequestId: string,
  ): Promise<void>;
  unassignCoverage(
    coveredByVolunteerUserId: string,
    coverageRequestId: string,
  ): Promise<void>;
}

export class CoverageService implements ICoverageService {
  private readonly db: Drizzle;
  private readonly volunteerService: IVolunteerService;
  private readonly shiftService: IShiftService;

  constructor({
    db,
    volunteerService,
    shiftService,
  }: {
    db: Drizzle;
    volunteerService: IVolunteerService;
    shiftService: IShiftService;
  }) {
    this.db = db;
    this.volunteerService = volunteerService;
    this.shiftService = shiftService;
  }

  async getCoverageRequestsForShift(
    shiftId: string,
  ): Promise<CoverageRequest[]> {
    const coverageRequestDBs = await this.db
      .select()
      .from(coverageRequest)
      .where(eq(coverageRequest.shiftId, shiftId));

    return this.loadCoverageRequestModels(coverageRequestDBs);
  }

  async listCoverageRequests(
    input: ListCoverageRequestsInput,
    viewerUserId: string,
    viewerRole: Role,
  ): Promise<
    ListResponse<ListCoverageRequestBase | ListCoverageRequestWithReason>
  > {
    const { perPage, offset } = getPagination(input);
    const { status, from, to, courseIds } = input;
    const isAdmin = viewerRole === Role.admin;

    // Build WHERE conditions
    const whereConditions: SQL<unknown>[] = [];

    // Optional status filter
    if (status) {
      whereConditions.push(eq(coverageRequest.status, status));
    }

    // Optional lower bound date filter (coerced to Date by Zod)
    if (from) {
      whereConditions.push(gte(shift.startAt, from as Date));
    }

    // Optional upper bound date filter (coerced to Date by Zod)
    if (to) {
      whereConditions.push(lte(shift.startAt, to as Date));
    }

    // Optional course filter
    if (courseIds?.length) {
      whereConditions.push(inArray(course.id, courseIds));
    }

    // Role-based visibility filter for non-admins:
    // - See open requests EXCEPT for shifts they're already assigned to
    // - Always see their own requests (as requester or covering volunteer)
    if (!isAdmin) {
      whereConditions.push(
        or(
          // Show open requests only if volunteer is NOT already assigned to the shift
          and(
            eq(coverageRequest.status, CoverageStatus.open),
            // Not assigned via schedule
            sql`NOT EXISTS (
              SELECT 1 FROM ${volunteerToSchedule}
              WHERE ${volunteerToSchedule.scheduleId} = ${shift.scheduleId}
              AND ${volunteerToSchedule.volunteerUserId} = ${viewerUserId}
            )`,
            // Not already covering this shift via another resolved coverage request
            sql`NOT EXISTS (
              SELECT 1 FROM ${coverageRequest} AS cr2
              WHERE cr2.shift_id = ${shift.id}
              AND cr2.covered_by_volunteer_user_id = ${viewerUserId}
              AND cr2.status = ${CoverageStatus.resolved}
            )`,
          ),
          // Always show their own requests (as requester)
          eq(coverageRequest.requestingVolunteerUserId, viewerUserId),
          // Always show requests they're covering
          eq(coverageRequest.coveredByVolunteerUserId, viewerUserId),
        )!,
      );
    }

    // Query with pagination and total count
    const rows = await this.db
      .select({
        totalRecords: sql<number>`count(*) over()`,
        coverageRequest: coverageRequest,
        shift: {
          id: shift.id,
          date: shift.date,
          startAt: shift.startAt,
          endAt: shift.endAt,
          scheduleId: shift.scheduleId,
        },
        course: {
          id: course.id,
          name: course.name,
          termId: course.termId,
          image: course.image,
          description: course.description,
          meetingURL: course.meetingURL,
          category: course.category,
          subcategory: course.subcategory,
        },
      })
      .from(coverageRequest)
      .innerJoin(shift, eq(coverageRequest.shiftId, shift.id))
      .innerJoin(course, eq(shift.courseId, course.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(shift.startAt, coverageRequest.id)
      .limit(perPage)
      .offset(offset);

    if (rows.length === 0) {
      return { data: [], total: 0, nextCursor: null };
    }

    // Batch load instructors by schedule
    const scheduleIds = [...new Set(rows.map((r) => r.shift.scheduleId))];
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

    const instructorsBySchedule = new Map<
      string,
      ReturnType<typeof buildUser>[]
    >();
    for (const record of instructorRecords) {
      const list = instructorsBySchedule.get(record.scheduleId) ?? [];
      list.push(buildUser(record.instructor));
      instructorsBySchedule.set(record.scheduleId, list);
    }

    // Batch load shifts to get volunteers
    const shiftIds = [...new Set(rows.map((r) => r.shift.id))];
    const shiftModels = await this.shiftService.getShiftsByIds(shiftIds);
    const volunteersByShift = new Map(
      shiftModels.map((s) => [
        s.id,
        s.volunteers.map((v) => getEmbeddedVolunteer(v)),
      ]),
    );

    // Extract volunteer IDs for batch loading
    const volunteerIds = uniqueDefined(
      rows
        .flatMap((row) => [
          row.coverageRequest.requestingVolunteerUserId,
          row.coverageRequest.coveredByVolunteerUserId,
        ])
        .filter((id): id is string => id !== null),
    );

    // Batch load volunteers
    const volunteers = toMap(
      await this.volunteerService.getVolunteers(volunteerIds),
    );

    // Calculate pagination
    const total = rows[0]?.totalRecords ?? 0;
    const loadedSoFar = offset + rows.length;
    const nextCursor = loadedSoFar < total ? loadedSoFar : null;

    // Map to response type based on role
    const data = rows.map((row) => {
      const requestingVolunteer = volunteers.get(
        row.coverageRequest.requestingVolunteerUserId,
      )!;
      const coveringVolunteer = row.coverageRequest.coveredByVolunteerUserId
        ? volunteers.get(row.coverageRequest.coveredByVolunteerUserId)
        : undefined;

      const embeddedShift: EmbeddedShift = {
        id: row.shift.id,
        date: row.shift.date,
        startAt: row.shift.startAt,
        endAt: row.shift.endAt,
        class: {
          id: row.course.id,
          name: row.course.name,
          termId: row.course.termId,
          image: row.course.image,
          description: row.course.description,
          meetingURL: row.course.meetingURL,
          category: row.course.category,
          subcategory: row.course.subcategory,
        },
        instructors: instructorsBySchedule.get(row.shift.scheduleId) ?? [],
        volunteers: volunteersByShift.get(row.shift.id) ?? [],
      };

      const coverageModel = buildCoverageRequest(
        row.coverageRequest,
        embeddedShift,
        requestingVolunteer,
        coveringVolunteer,
      );

      // Return admin view with reason fields, or base view for volunteers
      if (isAdmin) {
        return getListCoverageRequestWithReason(coverageModel);
      }
      return getListCoverageRequestBase(coverageModel);
    });

    return { data, total, nextCursor };
  }

  async getCoverageRequestById(id: string): Promise<CoverageRequest> {
    return this.getCoverageRequestByIds([id]).then((req) => req[0]!);
  }

  async getCoverageRequestByIds(ids: string[]): Promise<CoverageRequest[]> {
    const coverageRequestDBs = await this.db
      .select()
      .from(coverageRequest)
      .where(inArray(coverageRequest.id, ids));

    if (coverageRequestDBs.length !== ids.length) {
      throw new NeuronError(
        "Unable to find coverage request",
        NeuronErrorCodes.BAD_REQUEST,
      );
    }

    return this.loadCoverageRequestModels(coverageRequestDBs);
  }

  async createCoverageRequest(
    requestingVolunteerUserId: string,
    requestData: CreateCoverageRequest,
  ): Promise<string> {
    await this.shiftService.assertValidShift(
      requestingVolunteerUserId,
      requestData.shiftId,
    );

    const [created] = await this.db
      .insert(coverageRequest)
      .values({
        shiftId: requestData.shiftId,
        category: requestData.category,
        details: requestData.details,
        comments: requestData.comments,
        requestingVolunteerUserId: requestingVolunteerUserId,
      })
      .returning({ id: coverageRequest.id });

    return created!.id;
  }

  async cancelCoverageRequest(
    requestingVolunteerUserId: string,
    coverageRequestId: string,
  ): Promise<void> {
    const [request] = await this.db
      .select({
        status: coverageRequest.status,
        shiftStartAt: shift.startAt,
      })
      .from(coverageRequest)
      .innerJoin(shift, eq(coverageRequest.shiftId, shift.id))
      .where(
        and(
          eq(coverageRequest.id, coverageRequestId),
          eq(
            coverageRequest.requestingVolunteerUserId,
            requestingVolunteerUserId,
          ),
        ),
      );

    if (!request) {
      throw new NeuronError(
        `Could not find coverage request with id ${coverageRequestId} requested by volunteer with id ${requestingVolunteerUserId}.`,
        NeuronErrorCodes.NOT_FOUND,
      );
    }

    if (request.status != CoverageStatus.open) {
      throw new NeuronError(
        "Coverage request is not open.",
        NeuronErrorCodes.BAD_REQUEST,
      );
    }

    if (request.shiftStartAt <= new Date()) {
      throw new NeuronError(
        "Can not cancel a coverage request for a past shift.",
        NeuronErrorCodes.BAD_REQUEST,
      );
    }

    const affected = await this.db
      .update(coverageRequest)
      .set({
        status: CoverageStatus.withdrawn,
      })
      .where(eq(coverageRequest.id, coverageRequestId))
      .returning();

    if (affected.length < 1) {
      throw new NeuronError(
        "Failed to cancel coverage request",
        NeuronErrorCodes.BAD_REQUEST,
      );
    }
  }

  async fulfillCoverageRequest(
    coveredByVolunteerUserId: string,
    coverageRequestId: string,
  ): Promise<void> {
    const [request] = await this.db
      .select({
        status: coverageRequest.status,
        shiftStartAt: shift.startAt,
        shiftId: shift.id,
      })
      .from(coverageRequest)
      .innerJoin(shift, eq(coverageRequest.shiftId, shift.id))
      .where(eq(coverageRequest.id, coverageRequestId));

    if (!request) {
      throw new NeuronError(
        `Could not find coverage request with id ${coverageRequestId}.`,
        NeuronErrorCodes.NOT_FOUND,
      );
    }

    if (request.status != CoverageStatus.open) {
      throw new NeuronError(
        "Coverage request is not open.",
        NeuronErrorCodes.BAD_REQUEST,
      );
    }

    if (request.shiftStartAt <= new Date()) {
      throw new NeuronError(
        "Can not fulfill a coverage request for a past shift.",
        NeuronErrorCodes.BAD_REQUEST,
      );
    }

    // Check if volunteer is already assigned to this shift
    const shiftModel = await this.shiftService.getShiftById(
      request.shiftId,
      coveredByVolunteerUserId,
    );
    const isAssigned = shiftModel.volunteers.some(
      (v) => v.id === coveredByVolunteerUserId,
    );

    if (isAssigned) {
      throw new NeuronError(
        "Cannot cover a shift you are already assigned to.",
        NeuronErrorCodes.BAD_REQUEST,
      );
    }

    const affected = await this.db
      .update(coverageRequest)
      .set({
        status: CoverageStatus.resolved,
        coveredByVolunteerUserId: coveredByVolunteerUserId,
      })
      .where(eq(coverageRequest.id, coverageRequestId))
      .returning();

    if (affected.length < 1) {
      throw new NeuronError(
        "Failed to fill coverage request",
        NeuronErrorCodes.BAD_REQUEST,
      );
    }
  }

  async unassignCoverage(
    coveredByVolunteerUserId: string,
    coverageRequestId: string,
  ): Promise<void> {
    const [request] = await this.db
      .select({
        status: coverageRequest.status,
        shiftStartAt: shift.startAt,
      })
      .from(coverageRequest)
      .innerJoin(shift, eq(coverageRequest.shiftId, shift.id))
      .where(
        and(
          eq(coverageRequest.id, coverageRequestId),
          eq(
            coverageRequest.coveredByVolunteerUserId,
            coveredByVolunteerUserId,
          ),
        ),
      );

    if (!request) {
      throw new NeuronError(
        `Could not find coverage request with id ${coverageRequestId} covered by volunteer with id ${coveredByVolunteerUserId}.`,
        NeuronErrorCodes.NOT_FOUND,
      );
    }

    if (request.shiftStartAt <= new Date()) {
      throw new NeuronError(
        "Can not unassign coverage to a coverage request for a past shift.",
        NeuronErrorCodes.BAD_REQUEST,
      );
    }

    const affected = await this.db
      .update(coverageRequest)
      .set({
        status: CoverageStatus.open,
        requestingVolunteerUserId: coveredByVolunteerUserId,
        coveredByVolunteerUserId: null,
      })
      .where(eq(coverageRequest.id, coverageRequestId))
      .returning();

    if (affected.length < 1) {
      throw new NeuronError(
        "Failed to unassign coverage.",
        NeuronErrorCodes.BAD_REQUEST,
      );
    }
  }

  private async loadCoverageRequestModels(
    requestDBs: CoverageRequestDB[],
  ): Promise<CoverageRequest[]> {
    if (requestDBs.length === 0) return [];

    // Batch load shifts (includes class, instructors, volunteers)
    const shiftIds = uniqueDefined(requestDBs.map((r) => r.shiftId));
    const shiftModels = await this.shiftService.getShiftsByIds(shiftIds);

    // Build shift map with embedded shift data
    const shiftMap = new Map<string, EmbeddedShift>(
      shiftModels.map((s) => [
        s.id,
        {
          id: s.id,
          date: s.date,
          startAt: s.startAt,
          endAt: s.endAt,
          class: s.class,
          instructors: s.instructors,
          volunteers: s.volunteers.map((v) => getEmbeddedVolunteer(v)),
        },
      ]),
    );

    // Batch load volunteers for coverage requests
    const volunteerIds = uniqueDefined(
      requestDBs
        .flatMap((request) => [
          request.coveredByVolunteerUserId,
          request.requestingVolunteerUserId,
        ])
        .filter((r) => r !== null),
    );
    const volunteers = toMap(
      await this.volunteerService.getVolunteers(volunteerIds),
    );

    return requestDBs.map((req) =>
      buildCoverageRequest(
        req,
        shiftMap.get(req.shiftId)!,
        volunteers.get(req.requestingVolunteerUserId)!,
        req.coveredByVolunteerUserId
          ? volunteers.get(req.coveredByVolunteerUserId)!
          : undefined,
      ),
    );
  }
}
