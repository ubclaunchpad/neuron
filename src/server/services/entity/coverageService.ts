import { CoverageStatus, type CreateCoverageRequest } from "@/models/api/coverage";
import { buildCoverageRequest, type CoverageRequest } from "@/models/coverage";
import type { Drizzle } from "@/server/db";
import { coverageRequest, type CoverageRequestDB } from "@/server/db/schema";
import { NeuronError, NeuronErrorCodes } from "@/server/errors/neuron-error";
import { toMap, uniqueDefined } from "@/utils/arrayUtils";
import { eq, inArray, and } from "drizzle-orm/sql";
import type { VolunteerService } from "./volunteerService";
import { shift } from "@/server/db/schema";
import type { ShiftService } from "./shiftService";

export class CoverageService {
    private readonly db: Drizzle;
    private readonly volunteerService: VolunteerService;
    private readonly shiftService: ShiftService;
  
    constructor(
        db: Drizzle, 
        volunteerService: VolunteerService,
        shiftService: ShiftService,
    ) {
        this.db = db;
        this.volunteerService = volunteerService;
        this.shiftService = shiftService;
    }

    async getCoverageRequestsForShift(shiftId: string): Promise<CoverageRequest[]>  {
        const coverageRequestDBs = await this.db.select()
            .from(coverageRequest)
            .where(eq(coverageRequest.shiftId, shiftId));

        return this.formatCoverageRequests(coverageRequestDBs);
    }

    async getCoverageRequestById(id: string): Promise<CoverageRequest>  {
        return this.getCoverageRequestByIds([id]).then(req => req[0]!);
    }

    async getCoverageRequestByIds(ids: string[]): Promise<CoverageRequest[]>  {
        const coverageRequestDBs = await this.db.select()
            .from(coverageRequest)
            .where(inArray(coverageRequest.id, ids));

        if (coverageRequestDBs.length !== ids.length) {
            throw new NeuronError("Unable to find coverage request", NeuronErrorCodes.BAD_REQUEST);
        }

        return this.formatCoverageRequests(coverageRequestDBs);
    }

    async createCoverageRequest(requestingVolunteerUserId: string, requestData: CreateCoverageRequest): Promise<string> {
        await this.shiftService.assertValidShift(requestingVolunteerUserId, requestData.shiftId);

        const [created] = await this.db.insert(coverageRequest).values({
                shiftId: requestData.shiftId,
                category: requestData.category,
                details: requestData.details,
                comments: requestData.comments,
                requestingVolunteerUserId: requestingVolunteerUserId,
            })
            .returning({ id: coverageRequest.id });

        return created!.id;
    }

    async cancelCoverageRequest(requestingVolunteerUserId: string, coverageRequestId: string): Promise<void> {
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
                    eq(coverageRequest.requestingVolunteerUserId, requestingVolunteerUserId),
                )
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

        const affected = await this.db.update(coverageRequest).set({
            status: CoverageStatus.withdrawn,
        })
        .where(eq(coverageRequest.id, coverageRequestId))
        .returning();

        if (affected.length < 1) {
            throw new NeuronError("Failed to cancel coverage request", NeuronErrorCodes.BAD_REQUEST);
        }
    }

    async fulfillCoverageRequest(coveredByVolunteerUserId: string, coverageRequestId: string): Promise<void> {
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
    
        const affected = await this.db.update(coverageRequest).set({
            status: CoverageStatus.resolved,
            coveredByVolunteerUserId: coveredByVolunteerUserId
        }).where(
            eq(coverageRequest.id, coverageRequestId)
        )
        .returning();

        if (affected.length < 1) {
            throw new NeuronError("Failed to fill coverage request", NeuronErrorCodes.BAD_REQUEST);
        }
    }

    async unassignCoverage(coveredByVolunteerUserId: string, coverageRequestId: string): Promise<void> {
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
                    eq(coverageRequest.coveredByVolunteerUserId, coveredByVolunteerUserId),
                )
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

        const affected = await this.db.update(coverageRequest).set({
            status: CoverageStatus.open,
            requestingVolunteerUserId: coveredByVolunteerUserId,
            coveredByVolunteerUserId: null,
        }).where(
            eq(coverageRequest.id, coverageRequestId)
        )
        .returning();

        if (affected.length < 1) {
            throw new NeuronError("Failed to unassign coverage.", NeuronErrorCodes.BAD_REQUEST);
        }
    }

    private async formatCoverageRequests(requestDBs: CoverageRequestDB[]): Promise<CoverageRequest[]> {
        // Dedupe and get volunteers
        const volunteerIds = uniqueDefined(requestDBs.flatMap((request) =>
            [request.coveredByVolunteerUserId, request.requestingVolunteerUserId]
        ).filter(r => r !== null));
        const volunteers = toMap(await this.volunteerService.getVolunteers(volunteerIds));
    
        return requestDBs.map((req) =>
            buildCoverageRequest(
                req,
                volunteers.get(req.requestingVolunteerUserId)!,
                req.coveredByVolunteerUserId ? volunteers.get(req.coveredByVolunteerUserId)! : undefined
            ),
        );
    }
}