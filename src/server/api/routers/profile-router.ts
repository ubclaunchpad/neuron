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
      const result = await ctx.profileService.getPresignedUrl(input.userId, input.fileExtension);
      return { ok: true, url: result };
    }),
    update: authorizedProcedure({
      permission: { profile: ["update"] },
    })
      .input(UpdateProfileImageInput)
      .mutation(async ({ input, ctx }) => {
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