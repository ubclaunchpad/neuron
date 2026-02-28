import {
  CoverageRequestIdInput,
  CreateCoverageRequest,
  ListCoverageRequestsInput,
} from "@/models/api/coverage";
import { Role } from "@/models/interfaces";
import { authorizedProcedure } from "@/server/api/procedures";
import { createTRPCRouter } from "@/server/api/trpc";

export const coverageRouter = createTRPCRouter({
  list: authorizedProcedure({
    permission: { coverage: ["view"] },
  })
    .input(ListCoverageRequestsInput)
    .query(async ({ input, ctx }) => {
      const currentUser = ctx.currentSessionService.requireUser();

      return await ctx.coverageService.listCoverageRequests(
        input,
        currentUser.id,
        currentUser.role as Role,
      );
    }),
  requestCoverage: authorizedProcedure({
    permission: { coverage: ["request"] },
  })
    .input(CreateCoverageRequest)
    .mutation(async ({ input, ctx }) => {
      const currentUser = ctx.currentSessionService.requireUser();

      return await ctx.coverageService.createCoverageRequest(
        currentUser.id,
        input,
      );
    }),
  cancelCoverageRequest: authorizedProcedure({
    permission: { coverage: ["request"] },
  })
    .input(CoverageRequestIdInput)
    .mutation(async ({ input, ctx }) => {
      const currentUser = ctx.currentSessionService.requireUser();

      await ctx.coverageService.cancelCoverageRequest(
        currentUser.id,
        input.coverageRequestId,
      );
    }),
  fillCoverageRequest: authorizedProcedure({
    permission: { coverage: ["fill"] },
  })
    .input(CoverageRequestIdInput)
    .mutation(async ({ input, ctx }) => {
      const currentUser = ctx.currentSessionService.requireUser();

      await ctx.coverageService.fulfillCoverageRequest(
        currentUser.id,
        input.coverageRequestId,
      );
    }),
  unassignCoverage: authorizedProcedure({
    permission: { coverage: ["fill"] },
  })
    .input(CoverageRequestIdInput)
    .mutation(async ({ input, ctx }) => {
      const currentUser = ctx.currentSessionService.requireUser();

      await ctx.coverageService.unassignCoverage(
        currentUser.id,
        input.coverageRequestId,
      );
    }),
});
