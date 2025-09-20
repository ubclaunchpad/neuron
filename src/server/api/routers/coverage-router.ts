import {
  CoverageRequestIdInput,
  CreateCoverageRequestInput,
} from "@/models/api/coverage";
import { authorizedProcedure } from "@/server/api/procedures";
import { createTRPCRouter } from "@/server/api/trpc";

export const coverageRouter = createTRPCRouter({
  requestCoverage: authorizedProcedure({
    permission: { coverage: ["request"] },
  })
    .input(CreateCoverageRequestInput)
    .mutation(async ({ input, ctx }) => {
      // TODO
      return { ok: true };
    }),
  cancelCoverageRequest: authorizedProcedure({
    permission: { coverage: ["request"] },
  })
    .input(CoverageRequestIdInput)
    .mutation(async ({ input, ctx }) => {
      // TODO
      return { ok: true };
    }),
  fillCoverageRequest: authorizedProcedure({
    permission: { coverage: ["fill"] },
  })
    .input(CoverageRequestIdInput)
    .mutation(async ({ input, ctx }) => {
      // TODO
      return { ok: true };
    }),
});
