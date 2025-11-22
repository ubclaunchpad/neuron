import { GetPresignedUrlInput } from "@/models/api/image";
import { authorizedProcedure } from "@/server/api/procedures";
import { createTRPCRouter } from "@/server/api/trpc";

export const storageRouter = createTRPCRouter({
  getPresignedUrl: authorizedProcedure({ permission: { profile: ["update"] } })
    .input(GetPresignedUrlInput)
    .mutation(async ({ input, ctx }) => {
      return await ctx.imageService.getPresignedUrl(input.fileExtension);
    }),
});