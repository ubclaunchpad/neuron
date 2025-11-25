import { GetShiftsInput, ShiftIdInput } from "@/models/api/shift";
import { authorizedProcedure } from "@/server/api/procedures";
import { createTRPCRouter } from "@/server/api/trpc";

export const shiftRouter = createTRPCRouter({
  list: authorizedProcedure({ permission: { shifts: ["view"] } })
    .input(GetShiftsInput)
    .query(({ input, ctx }) => {
      return ctx.shiftService.getShifts(input);
    }),
  checkIn: authorizedProcedure({
    permissions: {
      statements: [{ shifts: ["check-in"] }, { shifts: ["override-check-in"] }],
      connector: "OR",
    },
  })
    .input(ShiftIdInput)
    .mutation(async ({ input }) => {
      // TODO: checkInShift
      return { ok: true };
    }),
  byId: authorizedProcedure({ permission: { shifts: ["view"] } })
    .input(ShiftIdInput)
    .query(async ({ input, ctx }) => {
      return {
        /* shift */
      };
    }),
  cancel: authorizedProcedure({ permission: { shifts: ["cancel"] } })
    .input(ShiftIdInput)
    .mutation(async ({ input }) => {
      // TODO: cancelShift
      return { ok: true };
    }),
});
