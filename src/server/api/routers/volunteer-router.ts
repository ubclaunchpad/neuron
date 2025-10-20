import {
  AdminSignoffInput,
  GetVolunteersInput,
  VolunteerIdInput,
} from "@/models/api/volunteer";
import { authorizedProcedure } from "@/server/api/procedures";
import { createTRPCRouter } from "@/server/api/trpc";

export const volunteerRouter = createTRPCRouter({
  list: authorizedProcedure({ permission: { users: ["view-volunteer"] } })
    .input(GetVolunteersInput)
    .query(async ({ input }) => {
      // TODO: getVolunteers
      return [];
    }),
  updateClassPreferences: authorizedProcedure({
    permission: { profile: ["update"] },
  })
    .input(VolunteerIdInput)
    .mutation(async ({ input }) => {
      // TODO: updatePreferredClassesById
      return { ok: true };
    }),
  getClassPreferences: authorizedProcedure({
    permission: { profile: ["update"] },
  })
    .input(VolunteerIdInput)
    .query(async ({ input }) => {
      // TODO: getClassPreferences
      return { ok: true };
    }),
  byId: authorizedProcedure({ permission: { users: ["view-volunteer"] } })
    .input(VolunteerIdInput)
    .query(async ({ input }) => {
      // TODO: getVolunteerById
      return {
        /* volunteer */
      };
    }),
  activate: authorizedProcedure({ permission: { users: ["activate"] } })
    .input(VolunteerIdInput.merge(AdminSignoffInput))
    .mutation(async ({ input, ctx }) => {
      await ctx.volunteerService.verifyVolunteer(input.volunteerUserId);
      return { ok: true };
    }),
  deactivate: authorizedProcedure({ permission: { users: ["deactivate"] } })
    .input(VolunteerIdInput.merge(AdminSignoffInput))
    .mutation(async ({ input, ctx }) => {
      await ctx.volunteerService.deactivateVolunteer(input.volunteerUserId);
      return { ok: true };
    }),
  reject: authorizedProcedure({ permission: { users: ["activate"] } })
    .input(VolunteerIdInput.merge(AdminSignoffInput))
    .mutation(async ({ input, ctx }) => {
      await ctx.volunteerService.rejectVolunteer(input.volunteerUserId);
      return { ok: true };
    }),
});
