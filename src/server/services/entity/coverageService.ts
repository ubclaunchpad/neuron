import { CoverageStatus, type CreateCoverageRequest } from "@/models/api/coverage";
import { buildCoverageRequest, type CoverageRequest } from "@/models/coverage";
import type { Drizzle } from "@/server/db";
import { coverageRequest, type CoverageRequestDB } from "@/server/db/schema";
import { NeuronError, NeuronErrorCodes } from "@/server/errors/neuron-error";
import { toMap, uniqueDefined } from "@/utils/arrayUtils";
import { and, eq, inArray } from "drizzle-orm/sql";
import type { VolunteerService } from "./volunteerService";

export class CoverageService {
    private readonly db: Drizzle;
    private readonly volunteerService: VolunteerService;
  
    constructor(db: Drizzle, volunteerService: VolunteerService) {
        this.db = db;
        this.volunteerService = volunteerService;
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
            throw new NeuronError("Unable to find coverage request", "BAD_REQUEST");
        }

        return this.formatCoverageRequests(coverageRequestDBs);
    }

    async createCoverageRequest(volunteerUserId: string, requestData: CreateCoverageRequest): Promise<string> {
        const [created] = await this.db.insert(coverageRequest).values({
                shiftId: requestData.shiftId,
                category: requestData.category,
                details: requestData.details,
                comments: requestData.comments,
                requestingVolunteerUserId: volunteerUserId,
            })
            .returning({ id: coverageRequest.id });

        return created!.id;
    }

    async cancelCoverageRequest(volunteerUserId: string, shiftId: string): Promise<void> {
        // ensure current coverage request status is open, not resolved

        const affected = await this.db.update(coverageRequest).set({
            status: CoverageStatus.withdrawn,
        }).where(
            and(
                eq(coverageRequest.coveredByVolunteerUserId, volunteerUserId), 
                eq(coverageRequest.shiftId, shiftId),
            )
        )
        .returning();

        if (affected.length < 1) {
            throw new NeuronError("Failed to cancel coverage request", NeuronErrorCodes.BAD_REQUEST);
        }
    }

    async fulfillCoverageRequest(volunteerUserId: string, coverageRequestId: string): Promise<void> {
        // Grab the current state of the coverageRequest, make sure the current state is open
        // Grab the shift via the coverageRequest.shiftId, ensure that this user isnt working this shift already

        const affected = await this.db.update(coverageRequest).set({
            status: CoverageStatus.resolved,
            coveredByVolunteerUserId: volunteerUserId
        }).where(
            eq(coverageRequest.id, coverageRequestId)
        )
        .returning();

        if (affected.length < 1) {
            throw new NeuronError("Failed to fill coverage request", NeuronErrorCodes.BAD_REQUEST);
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