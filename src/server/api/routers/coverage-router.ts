import {
  CoverageRequestIdInput,
  CreateCoverageRequest,
  ListCoverageRequestsInput,
} from "@/models/api/coverage";
import {
  getListCoverageRequestBase,
  getListCoverageRequestWithReason,
} from "@/models/coverage";
import { Role } from "@/models/interfaces";
import { hasPermission } from "@/lib/auth/extensions/permissions";
import { authorizedProcedure } from "@/server/api/procedures";
import { createTRPCRouter } from "@/server/api/trpc";

export const coverageRouter = createTRPCRouter({
  byId: authorizedProcedure({
    permission: { coverage: ["view"] },
  })
    .input(CoverageRequestIdInput)
    .query(async ({ input, ctx }) => {
      const currentUser = ctx.currentSessionService.requireUser();
      const request = await ctx.coverageService.getCoverageRequestById(
        input.coverageRequestId,
      );

      if (
        hasPermission({
          role: currentUser.role as Role,
          permission: { shifts: ["view-all"] },
        })
      ) {
        return getListCoverageRequestWithReason(request);
      }
      return getListCoverageRequestBase(request);
    }),
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
