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
import { hasPermission } from "@/lib/auth/extensions/permissions";
import { formatDate } from "@/lib/constants";
import { Role } from "@/models/interfaces";
import type { EmbeddedShift } from "@/models/shift";
import { getEmbeddedVolunteer } from "@/models/volunteer";
import type { ListResponse } from "@/models/list-response";
import type { Drizzle } from "@/server/db";
import { course, term } from "@/server/db/schema/course";
import {
  coverageRequest,
  shift,
  type CoverageRequestDB,
} from "@/server/db/schema";
import { user } from "@/server/db/schema/user";
import { NeuronError, NeuronErrorCodes } from "@/server/errors/neuron-error";
import {
  isVolunteerEffectivelyAssignedToShift,
  isVolunteerEffectivelyAssignedToShiftSql,
} from "@/server/services/entity/shiftAssignment";
import { toMap, uniqueDefined } from "@/utils/arrayUtils";
import { getPagination } from "@/utils/searchUtils";
import {
  asc,
  desc,
  and,
  eq,
  gte,
  inArray,
  isNull,
  lte,
  ne,
  not,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import type { IVolunteerService } from "./volunteerService";
import type { IShiftService } from "./shiftService";
import type { ICurrentSessionService } from "../currentSessionService";
import type { INotificationEventService } from "../notificationEventService";

export interface ICoverageService {
  getCoverageRequestsForShift(shiftId: string): Promise<CoverageRequest[]>;
  listCoverageRequests(
    input: ListCoverageRequestsInput,
  ): Promise<
    ListResponse<ListCoverageRequestBase | ListCoverageRequestWithReason>
  >;
  getCoverageRequestById(
    id: string,
  ): Promise<ListCoverageRequestBase | ListCoverageRequestWithReason>;
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
  private readonly currentSessionService: ICurrentSessionService;
  private readonly volunteerService: IVolunteerService;
  private readonly shiftService: IShiftService;
  private readonly notificationEventService: INotificationEventService;

  constructor({
    db,
    currentSessionService,
    volunteerService,
    shiftService,
    notificationEventService,
  }: {
    db: Drizzle;
    currentSessionService: ICurrentSessionService;
    volunteerService: IVolunteerService;
    shiftService: IShiftService;
    notificationEventService: INotificationEventService;
  }) {
    this.db = db;
    this.currentSessionService = currentSessionService;
    this.volunteerService = volunteerService;
    this.shiftService = shiftService;
    this.notificationEventService = notificationEventService;
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
  ): Promise<
    ListResponse<ListCoverageRequestBase | ListCoverageRequestWithReason>
  > {
    const currentUser = this.currentSessionService.requireUser();
    const viewerUserId = currentUser.id;
    const viewerRole = currentUser.role as Role;
    const { perPage, offset } = getPagination(input);
    const { status, from, to, courseIds, sortOrder } = input;

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

    // only show coverage for published terms
    if (
      !hasPermission({
        role: viewerRole,
        permission: { terms: ["view-unpublished"] },
      })
    ) {
      whereConditions.push(eq(term.published, true));
    }

    // Role-based visibility filter for those who can't view all:
    // - See open requests EXCEPT for shifts they're already assigned to
    // - Always see their own requests (as requester or covering volunteer)
    if (
      !hasPermission({
        role: viewerRole,
        permission: { shifts: ["view-all"] },
      })
    ) {
      whereConditions.push(
        or(
          // Show open requests only if volunteer is NOT already effectively assigned to the shift
          and(
            eq(coverageRequest.status, CoverageStatus.open),
            not(
              isVolunteerEffectivelyAssignedToShiftSql(shift.id, viewerUserId),
            ),
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
        totalRecords: sql<number>`count(*) over()`.mapWith(Number),
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
          locationType: course.locationType,
          location: course.location,
          category: course.category,
          subcategory: course.subcategory,
        },
      })
      .from(coverageRequest)
      .innerJoin(shift, eq(coverageRequest.shiftId, shift.id))
      .innerJoin(course, eq(shift.courseId, course.id))
      .innerJoin(term, eq(course.termId, term.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(
        sortOrder === "asc" ? asc(shift.startAt) : desc(shift.startAt),
        desc(coverageRequest.id),
      )
      .limit(perPage)
      .offset(offset);

    if (rows.length === 0) {
      return { data: [], total: 0, nextCursor: null };
    }

    // Batch load shifts to get effective instructors and volunteers
    const shiftIds = [...new Set(rows.map((r) => r.shift.id))];
    const shiftModels = await this.shiftService.getShiftsByIds(shiftIds);
    const instructorsByShift = new Map(
      shiftModels.map((s) => [s.id, s.instructors]),
    );
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
          locationType: row.course.locationType,
          location: row.course.location,
          category: row.course.category,
          subcategory: row.course.subcategory,
        },
        instructors: instructorsByShift.get(row.shift.id) ?? [],
        volunteers: volunteersByShift.get(row.shift.id) ?? [],
      };

      const coverageModel = buildCoverageRequest(
        row.coverageRequest,
        embeddedShift,
        requestingVolunteer,
        coveringVolunteer,
      );

      // Return admin view with reason fields, or base view for volunteers
      if (
        hasPermission({
          role: viewerRole,
          permission: { shifts: ["view-all"] },
        })
      ) {
        return getListCoverageRequestWithReason(coverageModel);
      }
      return getListCoverageRequestBase(coverageModel);
    });

    return { data, total, nextCursor };
  }

  async getCoverageRequestById(
    id: string,
  ): Promise<ListCoverageRequestBase | ListCoverageRequestWithReason> {
    const currentUser = this.currentSessionService.requireUser();
    const viewerRole = currentUser.role as Role;

    const request = await this.getCoverageRequestByIds([id]).then(
      (req) => req[0]!,
    );

    const canViewAll = hasPermission({
      role: viewerRole,
      permission: { shifts: ["view-all"] },
    });

    if (!canViewAll) {
      const isRequester = request.requestingVolunteer.id === currentUser.id;
      const isCovering = request.coveringVolunteer?.id === currentUser.id;
      const isOpen = request.status === CoverageStatus.open;

      if (!isRequester && !isCovering && !isOpen) {
        throw new NeuronError(
          "Unable to find coverage request",
          NeuronErrorCodes.BAD_REQUEST,
        );
      }
    }

    if (canViewAll) {
      return getListCoverageRequestWithReason(request);
    }
    return getListCoverageRequestBase(request);
  }

  async getCoverageRequestByIds(ids: string[]): Promise<CoverageRequest[]> {
    if (ids.length === 0) return [];

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
    const { coverageRequestId, shiftInfo } = await this.db.transaction(
      async (tx) => {
        // Lock the shift row so creation serializes with cancellation and
        // competing assignment/coverage mutations on the same shift.
        const [lockedShift] = await tx
          .select({
            id: shift.id,
            courseId: shift.courseId,
            startAt: shift.startAt,
            endAt: shift.endAt,
            canceled: shift.canceled,
          })
          .from(shift)
          .where(eq(shift.id, requestData.shiftId))
          .for("update");

        if (!lockedShift) {
          throw new NeuronError(
            `Could not find a shift with id ${requestData.shiftId} assigned to volunteer with id ${requestingVolunteerUserId}.`,
            NeuronErrorCodes.NOT_FOUND,
          );
        }

        await this.shiftService.assertValidShift(
          requestingVolunteerUserId,
          requestData.shiftId,
          tx,
        );

        const [existingActiveRequest] = await tx
          .select({ id: coverageRequest.id })
          .from(coverageRequest)
          .where(
            and(
              eq(coverageRequest.shiftId, requestData.shiftId),
              eq(
                coverageRequest.requestingVolunteerUserId,
                requestingVolunteerUserId,
              ),
              ne(coverageRequest.status, CoverageStatus.withdrawn),
            ),
          )
          .limit(1);

        if (existingActiveRequest) {
          throw new NeuronError(
            "An active coverage request already exists for this shift.",
            NeuronErrorCodes.BAD_REQUEST,
          );
        }

        const [created] = await tx
          .insert(coverageRequest)
          .values({
            shiftId: requestData.shiftId,
            category: requestData.category,
            details: requestData.details,
            comments: requestData.comments,
            requestingVolunteerUserId,
          })
          .returning({ id: coverageRequest.id });

        const [courseRow] = await tx
          .select({ name: course.name })
          .from(course)
          .where(eq(course.id, lockedShift.courseId))
          .limit(1);

        return {
          coverageRequestId: created!.id,
          shiftInfo: courseRow
            ? {
                courseId: lockedShift.courseId,
                startAt: lockedShift.startAt,
                endAt: lockedShift.endAt,
                courseName: courseRow.name,
              }
            : null,
        };
      },
    );

    if (shiftInfo) {
      const currentUser = this.currentSessionService.getUser();
      void this.notificationEventService.notifyCoverageRequested({
        coverageRequestId,
        shiftId: requestData.shiftId,
        classId: shiftInfo.courseId,
        className: shiftInfo.courseName,
        shiftDate: formatDate(shiftInfo.startAt),
        shiftStartAt: shiftInfo.startAt,
        shiftEndAt: shiftInfo.endAt,
        requestingVolunteerUserId,
        requestingVolunteerName: currentUser
          ? `${currentUser.name} ${currentUser.lastName}`
          : "A volunteer",
        reason: requestData.details,
      });
    }

    return coverageRequestId;
  }

  async cancelCoverageRequest(
    requestingVolunteerUserId: string,
    coverageRequestId: string,
  ): Promise<void> {
    await this.db.transaction(async (tx) => {
      const [requestRef] = await tx
        .select({ shiftId: coverageRequest.shiftId })
        .from(coverageRequest)
        .where(eq(coverageRequest.id, coverageRequestId))
        .limit(1);

      if (!requestRef) {
        throw new NeuronError(
          `Could not find coverage request with id ${coverageRequestId} requested by volunteer with id ${requestingVolunteerUserId}.`,
          NeuronErrorCodes.NOT_FOUND,
        );
      }

      const [lockedShift] = await tx
        .select({
          id: shift.id,
          startAt: shift.startAt,
          canceled: shift.canceled,
        })
        .from(shift)
        .where(eq(shift.id, requestRef.shiftId))
        .for("update");

      if (!lockedShift) {
        throw new NeuronError(
          `Could not find coverage request with id ${coverageRequestId} requested by volunteer with id ${requestingVolunteerUserId}.`,
          NeuronErrorCodes.NOT_FOUND,
        );
      }

      const [request] = await tx
        .select({
          id: coverageRequest.id,
          status: coverageRequest.status,
          coveredByVolunteerUserId: coverageRequest.coveredByVolunteerUserId,
        })
        .from(coverageRequest)
        .where(
          and(
            eq(coverageRequest.id, coverageRequestId),
            eq(
              coverageRequest.requestingVolunteerUserId,
              requestingVolunteerUserId,
            ),
          ),
        )
        .limit(1);

      if (!request) {
        throw new NeuronError(
          `Could not find coverage request with id ${coverageRequestId} requested by volunteer with id ${requestingVolunteerUserId}.`,
          NeuronErrorCodes.NOT_FOUND,
        );
      }

      if (lockedShift.canceled) {
        throw new NeuronError(
          "Cannot cancel a coverage request for a canceled shift.",
          NeuronErrorCodes.BAD_REQUEST,
        );
      }

      if (
        request.status !== CoverageStatus.open ||
        request.coveredByVolunteerUserId !== null
      ) {
        throw new NeuronError(
          "Coverage request is not open.",
          NeuronErrorCodes.BAD_REQUEST,
        );
      }

      if (lockedShift.startAt <= new Date()) {
        throw new NeuronError(
          "Can not cancel a coverage request for a past shift.",
          NeuronErrorCodes.BAD_REQUEST,
        );
      }

      const affected = await tx
        .update(coverageRequest)
        .set({
          status: CoverageStatus.withdrawn,
        })
        .where(
          and(
            eq(coverageRequest.id, coverageRequestId),
            eq(coverageRequest.shiftId, lockedShift.id),
            eq(
              coverageRequest.requestingVolunteerUserId,
              requestingVolunteerUserId,
            ),
            eq(coverageRequest.status, CoverageStatus.open),
            isNull(coverageRequest.coveredByVolunteerUserId),
          ),
        )
        .returning({ id: coverageRequest.id });

      if (affected.length < 1) {
        throw new NeuronError(
          "Failed to cancel coverage request",
          NeuronErrorCodes.BAD_REQUEST,
        );
      }
    });
  }

  async fulfillCoverageRequest(
    coveredByVolunteerUserId: string,
    coverageRequestId: string,
  ): Promise<void> {
    const notificationContext = await this.db.transaction(async (tx) => {
      const [requestRef] = await tx
        .select({ shiftId: coverageRequest.shiftId })
        .from(coverageRequest)
        .where(eq(coverageRequest.id, coverageRequestId))
        .limit(1);

      if (!requestRef) {
        throw new NeuronError(
          `Could not find coverage request with id ${coverageRequestId}.`,
          NeuronErrorCodes.NOT_FOUND,
        );
      }

      const [lockedShift] = await tx
        .select({
          id: shift.id,
          courseId: shift.courseId,
          startAt: shift.startAt,
          canceled: shift.canceled,
        })
        .from(shift)
        .where(eq(shift.id, requestRef.shiftId))
        .for("update");

      if (!lockedShift) {
        throw new NeuronError(
          `Could not find coverage request with id ${coverageRequestId}.`,
          NeuronErrorCodes.NOT_FOUND,
        );
      }

      const [request] = await tx
        .select({
          id: coverageRequest.id,
          status: coverageRequest.status,
          requestingVolunteerUserId: coverageRequest.requestingVolunteerUserId,
          coveredByVolunteerUserId: coverageRequest.coveredByVolunteerUserId,
        })
        .from(coverageRequest)
        .where(eq(coverageRequest.id, coverageRequestId))
        .limit(1);

      if (!request) {
        throw new NeuronError(
          `Could not find coverage request with id ${coverageRequestId}.`,
          NeuronErrorCodes.NOT_FOUND,
        );
      }

      if (lockedShift.canceled) {
        throw new NeuronError(
          "Cannot fulfill a coverage request for a canceled shift.",
          NeuronErrorCodes.BAD_REQUEST,
        );
      }

      if (
        request.status !== CoverageStatus.open ||
        request.coveredByVolunteerUserId !== null
      ) {
        throw new NeuronError(
          "Coverage request is not open.",
          NeuronErrorCodes.BAD_REQUEST,
        );
      }

      if (lockedShift.startAt <= new Date()) {
        throw new NeuronError(
          "Can not fulfill a coverage request for a past shift.",
          NeuronErrorCodes.BAD_REQUEST,
        );
      }

      // Check effective assignment under the shift lock so a volunteer already
      // on the shift (base or covering another slot) cannot occupy multiple
      // slots on the same shift even under concurrent claims.
      const isAssigned = await isVolunteerEffectivelyAssignedToShift(
        tx,
        lockedShift.id,
        coveredByVolunteerUserId,
      );

      if (isAssigned) {
        throw new NeuronError(
          "Cannot cover a shift you are already assigned to.",
          NeuronErrorCodes.BAD_REQUEST,
        );
      }

      if (request.requestingVolunteerUserId === coveredByVolunteerUserId) {
        throw new NeuronError(
          "Cannot cover your own coverage request.",
          NeuronErrorCodes.BAD_REQUEST,
        );
      }

      const affected = await tx
        .update(coverageRequest)
        .set({
          status: CoverageStatus.resolved,
          coveredByVolunteerUserId,
        })
        .where(
          and(
            eq(coverageRequest.id, coverageRequestId),
            eq(coverageRequest.shiftId, lockedShift.id),
            eq(coverageRequest.status, CoverageStatus.open),
            isNull(coverageRequest.coveredByVolunteerUserId),
          ),
        )
        .returning({ id: coverageRequest.id });

      if (affected.length < 1) {
        throw new NeuronError(
          "Coverage request is not open.",
          NeuronErrorCodes.BAD_REQUEST,
        );
      }

      const [[courseRow], [requestingUser]] = await Promise.all([
        tx
          .select({ name: course.name })
          .from(course)
          .where(eq(course.id, lockedShift.courseId))
          .limit(1),
        tx
          .select({ name: user.name, lastName: user.lastName })
          .from(user)
          .where(eq(user.id, request.requestingVolunteerUserId))
          .limit(1),
      ]);

      return {
        shiftId: lockedShift.id,
        courseId: lockedShift.courseId,
        courseName: courseRow?.name ?? "",
        shiftStartAt: lockedShift.startAt,
        requestingVolunteerUserId: request.requestingVolunteerUserId,
        requestingVolunteerName: requestingUser
          ? `${requestingUser.name} ${requestingUser.lastName}`
          : "A volunteer",
      };
    });

    // Notify admins, instructors, and requesting volunteer after commit
    const currentUser = this.currentSessionService.getUser();

    void this.notificationEventService.notifyCoverageFilled({
      coverageRequestId,
      shiftId: notificationContext.shiftId,
      classId: notificationContext.courseId,
      className: notificationContext.courseName,
      shiftDate: formatDate(notificationContext.shiftStartAt),
      coveredByVolunteerUserId,
      coveredByVolunteerName: currentUser
        ? `${currentUser.name} ${currentUser.lastName}`
        : "A volunteer",
      requestingVolunteerUserId: notificationContext.requestingVolunteerUserId,
      requestingVolunteerName: notificationContext.requestingVolunteerName,
    });
  }

  async unassignCoverage(
    coveredByVolunteerUserId: string,
    coverageRequestId: string,
  ): Promise<void> {
    await this.db.transaction(async (tx) => {
      const [requestRef] = await tx
        .select({ shiftId: coverageRequest.shiftId })
        .from(coverageRequest)
        .where(eq(coverageRequest.id, coverageRequestId))
        .limit(1);

      if (!requestRef) {
        throw new NeuronError(
          `Could not find coverage request with id ${coverageRequestId} covered by volunteer with id ${coveredByVolunteerUserId}.`,
          NeuronErrorCodes.NOT_FOUND,
        );
      }

      const [lockedShift] = await tx
        .select({
          id: shift.id,
          startAt: shift.startAt,
          canceled: shift.canceled,
        })
        .from(shift)
        .where(eq(shift.id, requestRef.shiftId))
        .for("update");

      if (!lockedShift) {
        throw new NeuronError(
          `Could not find coverage request with id ${coverageRequestId} covered by volunteer with id ${coveredByVolunteerUserId}.`,
          NeuronErrorCodes.NOT_FOUND,
        );
      }

      const [request] = await tx
        .select({
          id: coverageRequest.id,
          status: coverageRequest.status,
          requestingVolunteerUserId: coverageRequest.requestingVolunteerUserId,
          coveredByVolunteerUserId: coverageRequest.coveredByVolunteerUserId,
        })
        .from(coverageRequest)
        .where(
          and(
            eq(coverageRequest.id, coverageRequestId),
            eq(
              coverageRequest.coveredByVolunteerUserId,
              coveredByVolunteerUserId,
            ),
          ),
        )
        .limit(1);

      if (!request) {
        throw new NeuronError(
          `Could not find coverage request with id ${coverageRequestId} covered by volunteer with id ${coveredByVolunteerUserId}.`,
          NeuronErrorCodes.NOT_FOUND,
        );
      }

      if (lockedShift.canceled) {
        throw new NeuronError(
          "Cannot unassign coverage for a canceled shift.",
          NeuronErrorCodes.BAD_REQUEST,
        );
      }

      if (request.status !== CoverageStatus.resolved) {
        throw new NeuronError(
          "Coverage request is not resolved.",
          NeuronErrorCodes.BAD_REQUEST,
        );
      }

      if (lockedShift.startAt <= new Date()) {
        throw new NeuronError(
          "Can not unassign coverage to a coverage request for a past shift.",
          NeuronErrorCodes.BAD_REQUEST,
        );
      }

      const isEffectivelyAssigned = await isVolunteerEffectivelyAssignedToShift(
        tx,
        lockedShift.id,
        coveredByVolunteerUserId,
      );

      if (!isEffectivelyAssigned) {
        throw new NeuronError(
          "Cannot unassign coverage after your assignment has already been transferred.",
          NeuronErrorCodes.BAD_REQUEST,
        );
      }

      // Preserve the original requestingVolunteerUserId so the original absence
      // survives coverer withdrawal and subsequent replacement (A -> B -> C).
      const affected = await tx
        .update(coverageRequest)
        .set({
          status: CoverageStatus.open,
          coveredByVolunteerUserId: null,
        })
        .where(
          and(
            eq(coverageRequest.id, coverageRequestId),
            eq(coverageRequest.shiftId, lockedShift.id),
            eq(coverageRequest.status, CoverageStatus.resolved),
            eq(
              coverageRequest.coveredByVolunteerUserId,
              coveredByVolunteerUserId,
            ),
          ),
        )
        .returning({ id: coverageRequest.id });

      if (affected.length < 1) {
        throw new NeuronError(
          "Failed to unassign coverage.",
          NeuronErrorCodes.BAD_REQUEST,
        );
      }

      // If the outgoing coverer had an open outgoing coverage request on this
      // shift and is no longer assigned after unassigning, withdraw it so it
      // cannot be fulfilled to create an extra roster slot.
      const stillAssigned = await isVolunteerEffectivelyAssignedToShift(
        tx,
        lockedShift.id,
        coveredByVolunteerUserId,
      );
      if (!stillAssigned) {
        await tx
          .update(coverageRequest)
          .set({ status: CoverageStatus.withdrawn })
          .where(
            and(
              eq(coverageRequest.shiftId, lockedShift.id),
              eq(
                coverageRequest.requestingVolunteerUserId,
                coveredByVolunteerUserId,
              ),
              eq(coverageRequest.status, CoverageStatus.open),
              isNull(coverageRequest.coveredByVolunteerUserId),
            ),
          );
      }
    });
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
