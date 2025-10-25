import {
  CoverageRequestIdInput,
  CreateCoverageRequest,
} from "@/models/api/coverage";
import { authorizedProcedure } from "@/server/api/procedures";
import { createTRPCRouter } from "@/server/api/trpc";

export const coverageRouter = createTRPCRouter({
  requestCoverage: authorizedProcedure({
    permission: { coverage: ["request"] },
  })
    .input(CreateCoverageRequest)
    .mutation(async ({ input, ctx }) => {
      const currentUser = ctx.session.user;

      return await ctx.coverageService.createCoverageRequest(currentUser.id, input);
    }),
  cancelCoverageRequest: authorizedProcedure({
    permission: { coverage: ["request"] },
  })
    .input(CoverageRequestIdInput)
    .mutation(async ({ input, ctx }) => {
      const currentUser = ctx.session.user;

      await ctx.coverageService.cancelCoverageRequest(currentUser.id, input.coverageRequestId);
    }),
  fillCoverageRequest: authorizedProcedure({
    permission: { coverage: ["fill"] },
  })
    .input(CoverageRequestIdInput)
    .mutation(async ({ input, ctx }) => {
      const currentUser = ctx.session.user;

      await ctx.coverageService.fulfillCoverageRequest(currentUser.id, input.coverageRequestId);
    }),
  unassignCoverage: authorizedProcedure({
    permission: { coverage: ["fill"] },
  })
    .input(CoverageRequestIdInput)
    .mutation(async ({ input, ctx }) => {
      const currentUser = ctx.session.user;

      await ctx.coverageService.unassignCoverage(currentUser.id, input.coverageRequestId);
    })
});
