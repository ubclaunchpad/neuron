import { ListRequestWithSearch } from "@/models/api/common";
import { UserIdInput } from "@/models/api/user";
import {
  UpdateVolunteerAvailabilityInput,
  UpdateVolunteerProfileInput,
  VolunteerExportInput,
} from "@/models/api/volunteer";
import { authorizedProcedure } from "@/server/api/procedures";
import { createTRPCRouter } from "@/server/api/trpc";
import { z } from "zod";

export const volunteerRouter = createTRPCRouter({
  list: authorizedProcedure({ permission: { users: ["view"] } })
    .input(ListRequestWithSearch)
    .query(async ({ input, ctx }) => {
      const volunteers =
        await ctx.volunteerService.getVolunteersForRequest(input);
      return volunteers;
    }),
  me: authorizedProcedure({ permission: { "volunteer-profile": ["view"] } })
    .query(async ({ ctx }) => {
      const currentUser = ctx.currentSessionService.requireUser();
      return await ctx.volunteerService.getVolunteer(currentUser.id);
    }),
  setClassPreference: authorizedProcedure({
    permission: { classes: ["prefer"] },
  })
    .input(
      z.object({
        classId: z.uuid(),
        preferred: z.boolean(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const currentUser = ctx.currentSessionService.requireUser();
      await ctx.volunteerService.setClassPreference(
        currentUser.id,
        input.classId,
        input.preferred,
      );
      return { ok: true };
    }),
  getClassPreference: authorizedProcedure({
    permission: { classes: ["prefer"] },
  })
    .input(
      z.object({
        classId: z.uuid(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const currentUser = ctx.currentSessionService.requireUser();
      return await ctx.volunteerService.getClassPreference(
        currentUser.id,
        input.classId,
      );
    }),
  byId: authorizedProcedure({ permission: { users: ["view"] } })
    .input(UserIdInput)
    .query(async ({ input, ctx }) => {
      return await ctx.volunteerService.getVolunteer(input.userId);
    }),
  updateVolunteerProfile: authorizedProcedure({
    permission: { "volunteer-profile": ["update"] },
  })
    .input(UpdateVolunteerProfileInput)
    .mutation(async ({ input, ctx }) => {
      const currentUser = ctx.currentSessionService.requireUser();
      await ctx.volunteerService.updateVolunteerProfile(currentUser.id, input);
      return { ok: true };
    }),
  updateVolunteerAvailability: authorizedProcedure({
    permission: { "volunteer-profile": ["update"] },
  })
    .input(UpdateVolunteerAvailabilityInput)
    .mutation(async ({ input, ctx }) => {
      const currentUser = ctx.currentSessionService.requireUser();
      await ctx.volunteerService.updateVolunteerAvailability(
        currentUser.id,
        input,
      );
      return { ok: true };
    }),
  exportAvailability: authorizedProcedure({ permission: { users: ["view"] } })
    .input(VolunteerExportInput)
    .query(async ({ input, ctx }) => {
      return await ctx.volunteerService.getVolunteersForExport(
        input.search,
      );
    }),
});
