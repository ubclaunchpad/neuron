import { CreateTermInput, TermIdInput } from "@/models/api/term";
import { authorizedProcedure } from "@/server/api/procedures";
import { createTRPCRouter } from "@/server/api/trpc";

export const termRouter = createTRPCRouter({
  all: authorizedProcedure({ permission: { terms: ["view"] } })
    .query(async ({ input, ctx }) => {
      const terms = await ctx.termService.getAllTerms();
      return terms;
    }),
  create: authorizedProcedure({ permission: { terms: ["create"] } })
    .input(CreateTermInput)
    .mutation(async ({ input, ctx }) => {
      const id = await ctx.termService.createTerm(input);
      return id;
    }),
  delete: authorizedProcedure({ permission: { terms: ["delete"] } })
    .input(TermIdInput)
    .mutation(async ({ input, ctx }) => {
      await ctx.termService.deleteTerm(input.termId);
    }),
});
