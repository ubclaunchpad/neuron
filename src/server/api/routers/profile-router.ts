import { createTRPCRouter } from "@/server/api/trpc";


export const profileRouter = createTRPCRouter({
  // getPresignedUrl: authorizedProcedure({ permission: { profile: ["update"] } })
  //   .input(GetPresignedUrlInput)
  //   .mutation(async ({ input, ctx }) => {
  //     const result = await ctx.imageService.getPresignedUrl(input.objectType, input.id, input.fileExtension);
  //     return { ok: true, url: result };
  //   }),

     // TODO: update image for user in DB
    // updateProfileImage: authorizedProcedure({
    //   permission: { profile: ["update"] },
    // })
    //   .input(UpdateProfileImageInput)
    //   .mutation(async ({ input, ctx }) => {
    //     await ctx.profileService.updateProfileImage(input.userId, input.imageUrl);
    //     return { ok: true };
    //   }),

    // TODO: get image for user in DB
    // getProfileImage: authorizedProcedure({
    //   permission: { profile: ["view"] },
    // })
    //   .input(GetProfileImageInput)
    //   .query(async ({ input, ctx }) => {
    //     const result = await ctx.imageService.getProfileImage(input.userId);
    //     return { ok: true, url: result };
    //   }),
  });