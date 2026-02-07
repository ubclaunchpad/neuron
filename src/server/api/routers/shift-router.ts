import { hasPermission } from "@/lib/auth/extensions/permissions";
import {
  ShiftIdInput,
  GetShiftsInput,
  CheckInInput,
  CancelShiftInput,
} from "@/models/api/shift";
import { authorizedProcedure } from "@/server/api/procedures";
import { createTRPCRouter } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const shiftRouter = createTRPCRouter({
  list: authorizedProcedure({ permission: { shifts: ["view"] } })
    .input(GetShiftsInput)
    .query(({ input, ctx }) => {
      const currentUser = ctx.currentSessionService.requireUser();

      if (
        input.userId &&
        hasPermission({
          user: currentUser,
          permission: { shifts: ["view-all"] },
        })
      ) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.shiftService.listWindow({
        ...input,
        userId: input.userId ?? currentUser.id,
      });
    }),
  checkIn: authorizedProcedure({
    permissions: {
      statements: [{ shifts: ["check-in"] }, { shifts: ["override-check-in"] }],
      connector: "OR",
    },
  })
    .input(CheckInInput)
    .mutation(async ({ input, ctx }) => {
      const user = ctx.currentSessionService.requireUser();
      const hasOverride = hasPermission({
        user,
        permission: { shifts: ["override-check-in"] },
      });

      if (hasOverride && !input.volunteerId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      if (!hasOverride && input.volunteerId && input.volunteerId !== user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const volunteerId = hasOverride ? input.volunteerId! : user.id;

      return ctx.shiftService.checkIn(input.shiftId, volunteerId);
    }),
  byId: authorizedProcedure({ permission: { shifts: ["view"] } })
    .input(ShiftIdInput)
    .query(({ input, ctx }) => {
      const currentUser = ctx.currentSessionService.requireUser();
      return ctx.shiftService.getShiftById(input.shiftId, currentUser.id);
    }),
  cancel: authorizedProcedure({ permission: { shifts: ["cancel"] } })
    .input(CancelShiftInput)
    .mutation(({ input, ctx }) => ctx.shiftService.cancelShift(input)),
});
