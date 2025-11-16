import {
  AdminSignoffInput,
  VolunteerIdInput,
  UpdateVolunteerAvailabilityInput,
  UpdateVolunteerProfileInput,
} from "@/models/api/volunteer";
import { ListRequest } from "@/models/api/common";
import { authorizedProcedure } from "@/server/api/procedures";
import { createTRPCRouter } from "@/server/api/trpc";
import { z } from "zod";

export const volunteerRouter = createTRPCRouter({
  list: authorizedProcedure({ permission: { users: ["view-volunteer"] } })
    .input(ListRequest)
    .query(async ({ input, ctx }) => {
      const volunteers = await ctx.volunteerService.getVolunteersForRequest(input);
      return volunteers;
    }),
  setClassPreference: authorizedProcedure({
    permission: { profile: ["update"] },
  })
    .input(VolunteerIdInput.merge(z.object({classId: z.string().uuid(), preferred: z.boolean()})))
    .mutation(async ({ input, ctx }) => {
      await ctx.volunteerService.setClassPreference(input.volunteerUserId, input.classId, input.preferred)
      return { ok: true };
    }),
  getClassPreference: authorizedProcedure({
    permission: { profile: ["update"] },
  })
    .input(VolunteerIdInput.merge(z.object({classId: z.string().uuid()})))
    .query(async ({ input, ctx }) => {
      return await ctx.volunteerService.getClassPreference(input.volunteerUserId, input.classId)
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
