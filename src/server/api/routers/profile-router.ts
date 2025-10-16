import {
  GetPresignedUrlInput,
  UpdateProfileImageInput
} from "@/models/api/user";
// might change to volunteer if needed
import { authorizedProcedure } from "@/server/api/procedures";
import { createTRPCRouter } from "@/server/api/trpc";

export const profileRouter = createTRPCRouter({
  getPresignedUrl: authorizedProcedure({ permission: { profile: ["update"] } })
    .input(GetPresignedUrlInput)
    .mutation(async ({ input, ctx }) => {
        await ctx.profileService.getPresignedUrl(input.fileType);
      return { ok: true };
    }),
  update: authorizedProcedure({
    permission: { profile: ["update"] },
  })
    .input(UpdateProfileImageInput)
    .mutation(async ({ input, ctx }) => {
      console.log("Updating profile image for user:", input.userId);
      console.log("Image URL:", input.imageUrl);
      await ctx.profileService.updateProfileImage(input.userId, input.imageUrl);
      return { ok: true };
    }),
  get: authorizedProcedure({
    permission: { profile: ["view"] },
  }).query(async ({ ctx }) => {
    // TODO: getProfile
    return { ok: true };
  }),
});
