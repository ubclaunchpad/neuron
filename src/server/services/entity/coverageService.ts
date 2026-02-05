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
  type CoverageRequestShiftContext,
  type ListCoverageRequestBase,
  type ListCoverageRequestWithReason,
} from "@/models/coverage";
import { Role } from "@/models/interfaces";
import type { ListResponse } from "@/models/list-response";
import type { Drizzle } from "@/server/db";
import { course } from "@/server/db/schema/course";
import {
  coverageRequest,
  shift,
  type CoverageRequestDB,
} from "@/server/db/schema";
import { NeuronError, NeuronErrorCodes } from "@/server/errors/neuron-error";
import { toMap, uniqueDefined } from "@/utils/arrayUtils";
import { getPagination } from "@/utils/searchUtils";
import { and, desc, eq, inArray, or, sql, type SQL } from "drizzle-orm";
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

    return this.formatCoverageRequests(coverageRequestDBs);
  }

  async listCoverageRequests(
    input: ListCoverageRequestsInput,
    viewerUserId: string,
    viewerRole: Role,
  ): Promise<
    ListResponse<ListCoverageRequestBase | ListCoverageRequestWithReason>
  > {
    const { perPage, offset, status } = getPagination(input);
    const isAdmin = viewerRole === Role.admin;

    // Build WHERE conditions
    const whereConditions: SQL<unknown>[] = [];

    // Optional status filter
    if (status) {
      whereConditions.push(eq(coverageRequest.status, status));
    }

    // Role-based visibility filter (volunteers only see open or their own requests)
    if (!isAdmin) {
      whereConditions.push(
        or(
          eq(coverageRequest.status, CoverageStatus.open),
          eq(coverageRequest.requestingVolunteerUserId, viewerUserId),
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
        },
        course: {
          id: course.id,
          name: course.name,
        },
      })
      .from(coverageRequest)
      .innerJoin(shift, eq(coverageRequest.shiftId, shift.id))
      .innerJoin(course, eq(shift.courseId, course.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(shift.startAt), desc(coverageRequest.id))
      .limit(perPage)
      .offset(offset);

    if (rows.length === 0) {
      return { data: [], total: 0, nextCursor: null };
    }

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

      const coverageModel = buildCoverageRequest(
        row.coverageRequest,
        requestingVolunteer,
        coveringVolunteer,
      );

      const shiftContext: CoverageRequestShiftContext = {
        id: row.shift.id,
        date: row.shift.date,
        startAt: row.shift.startAt,
        endAt: row.shift.endAt,
        className: row.course.name,
        classId: row.course.id,
      };

      // Return admin view with reason fields, or base view for volunteers
      if (isAdmin) {
        return getListCoverageRequestWithReason(coverageModel, shiftContext);
      }
      return getListCoverageRequestBase(coverageModel, shiftContext);
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

    return this.formatCoverageRequests(coverageRequestDBs);
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

  private async formatCoverageRequests(
    requestDBs: CoverageRequestDB[],
  ): Promise<CoverageRequest[]> {
    // Dedupe and get volunteers
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
        volunteers.get(req.requestingVolunteerUserId)!,
        req.coveredByVolunteerUserId
          ? volunteers.get(req.coveredByVolunteerUserId)!
          : undefined,
      ),
    );
  }
}
