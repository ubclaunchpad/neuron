import {
  CreateTermInput,
  TermIdInput,
  UpdateTermInput,
} from "@/models/api/term";
import { authorizedProcedure } from "@/server/api/procedures";
import { createTRPCRouter } from "@/server/api/trpc";

export const termRouter = createTRPCRouter({
  all: authorizedProcedure({ permission: { terms: ["view"] } }).query(
    async ({ ctx }) => {
      const terms = await ctx.termService.getAllTerms();
      return terms;
    },
  ),
  byId: authorizedProcedure({ permission: { terms: ["view"] } })
    .input(TermIdInput)
    .query(async ({ input, ctx }) => {
      const term = await ctx.termService.getTerm(input.termId);
      return term;
    }),
  current: authorizedProcedure({ permission: { terms: ["view"] } }).query(
    async ({ ctx }) => {
      return await ctx.termService.getCurrentTerm();
    },
  ),
  create: authorizedProcedure({ permission: { terms: ["create"] } })
    .input(CreateTermInput)
    .mutation(async ({ input, ctx }) => {
      const id = await ctx.termService.createTerm(input);
      return id;
    }),
  update: authorizedProcedure({ permission: { terms: ["create"] } })
    .input(UpdateTermInput)
    .mutation(async ({ input, ctx }) => {
      await ctx.termService.updateTerm(input);
    }),
  delete: authorizedProcedure({ permission: { terms: ["delete"] } })
    .input(TermIdInput)
    .mutation(async ({ input, ctx }) => {
      await ctx.termService.deleteTerm(input.termId);
    }),
  publish: authorizedProcedure({ permission: { terms: ["publish"] } })
    .input(TermIdInput)
    .mutation(async ({ input, ctx }) => {
      await ctx.termService.publishTerm(input.termId);
    }),
  unpublish: authorizedProcedure({ permission: { terms: ["publish"] } })
    .input(TermIdInput)
    .mutation(async ({ input, ctx }) => {
      await ctx.termService.unpublishTerm(input.termId);
    }),
});
