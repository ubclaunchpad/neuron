import {
  AdminSignoffInput,
  VolunteerIdInput,
  UpdateVolunteerAvailabilityInput,
  UpdateVolunteerProfileInput,
} from "@/models/api/volunteer";
import { ListRequest } from "@/models/api/common";
import { authorizedProcedure } from "@/server/api/procedures";
import { createTRPCRouter } from "@/server/api/trpc";

export const volunteerRouter = createTRPCRouter({
  list: authorizedProcedure({ permission: { users: ["view-volunteer"] } })
    .input(ListRequest)
    .query(async ({ input, ctx }) => {
      const volunteers = await ctx.volunteerService.getVolunteersForRequest(input);
      return volunteers;
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
  updateVolunteerProfile: authorizedProcedure({
    permission: { profile: ["update"] },
  })
    .input(UpdateVolunteerProfileInput)
    .mutation(async ({ input, ctx }) => {
      await ctx.volunteerService.updateVolunteerProfile(input);
      return { ok: true };
    }),
  updateVolunteerAvailability: authorizedProcedure({
    permission: { profile: ["update"] },
  })
    .input(UpdateVolunteerAvailabilityInput)
    .mutation(async ({ input, ctx }) => {
      await ctx.volunteerService.updateVolunteerAvailability(input.volunteerUserId, input.availability);
      return { ok: true };
    }),

  // Verification
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
