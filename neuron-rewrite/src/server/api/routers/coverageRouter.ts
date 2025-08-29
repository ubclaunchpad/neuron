import {
    CoverageRequestIdInput,
    CreateCoverageRequestInput
} from "@/models/api/coverage";
import { authorizedProcedure } from "@/server/api/procedures";
import { createTRPCRouter } from "@/server/api/trpc";

export const coverageRouter = createTRPCRouter({
    requestCoverage: authorizedProcedure
        .input(CreateCoverageRequestInput)
        .mutation(async ({ input }) => {
            // TODO
            return { ok: true };
        }),
    cancelCoverageRequest: authorizedProcedure
        .input(CoverageRequestIdInput)
        .mutation(async ({ input }) => {
            // TODO
            return { ok: true };
        }),
    fillCoverageRequest: authorizedProcedure
        .input(CoverageRequestIdInput)
        .mutation(async ({ input }) => {
            // TODO
            return { ok: true };
        }),
});