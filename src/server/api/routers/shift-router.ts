import { hasPermission } from "@/lib/auth/extensions/permissions";
import { ShiftIdInput, GetShiftsInput } from "@/models/api/shift";
import { authorizedProcedure } from "@/server/api/procedures";
import { createTRPCRouter } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const shiftRouter = createTRPCRouter({
  list: authorizedProcedure({ permission: { shifts: ["view"] } })
    .input(GetShiftsInput)
    .query(({ input, ctx }) => {
      if (
        input.userId &&
        hasPermission({
          user: ctx.session.user,
          permission: { shifts: ["view-all"] },
        })
      ) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.shiftService.listWindow({
        ...input,
        userId: input.userId ?? ctx.session.user.id,
      });
    }),
  checkIn: authorizedProcedure({
    permissions: {
      statements: [{ shifts: ["check-in"] }, { shifts: ["override-check-in"] }],
      connector: "OR",
    },
  })
    .input(ShiftIdInput)
    .mutation(async ({ input }) => {
      return { ok: true };
    }),
  byId: authorizedProcedure({ permission: { shifts: ["view"] } })
    .input(ShiftIdInput)
    .query(async ({ input, ctx }) =>
      ctx.shiftService.getShiftById(input.shiftId, ctx.session.user.id),
    ),
  cancel: authorizedProcedure({ permission: { shifts: ["cancel"] } })
    .input(ShiftIdInput)
    .mutation(async ({ input }) => {
      // TODO: cancelShift
      return { ok: true };
    }),
});
