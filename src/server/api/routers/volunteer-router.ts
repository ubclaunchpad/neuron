import { ListRequestWithSearch } from "@/models/api/common";
import { UserIdInput } from "@/models/api/user";
import {
  UpdateVolunteerAvailabilityInput,
  UpdateVolunteerProfileInput,
} from "@/models/api/volunteer";
import { authorizedProcedure } from "@/server/api/procedures";
import { createTRPCRouter } from "@/server/api/trpc";
import { z } from "zod";

export const volunteerRouter = createTRPCRouter({
  list: authorizedProcedure({ permission: { users: ["view"] } })
    .input(ListRequestWithSearch)
    .query(async ({ input, ctx }) => {
      const volunteers = await ctx.volunteerService.getVolunteersForRequest(input);
      return volunteers;
    }),
  setClassPreference: authorizedProcedure({
    permission: { profile: ["update"] },
  })
    .input(UserIdInput.extend({
      classId: z.uuid(),
      preferred: z.boolean()
    }))
    .mutation(async ({ input, ctx }) => {
      await ctx.volunteerService.setClassPreference(input.userId, input.classId, input.preferred)
      return { ok: true };
    }),
  getClassPreference: authorizedProcedure({
    permission: { profile: ["update"] },
  })
    .input(UserIdInput.extend({
      classId: z.uuid()
    }))
    .query(async ({ input, ctx }) => {
      return await ctx.volunteerService.getClassPreference(input.userId, input.classId)
    }),
  byId: authorizedProcedure({ permission: { users: ["view"] } })
    .input(UserIdInput)
    .query(async ({ input, ctx }) => {
      return await ctx.volunteerService.getVolunteer(input.userId);
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
});
