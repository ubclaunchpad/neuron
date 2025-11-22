import { z } from "zod";

export const GetPresignedUrlInput = z.object({
  fileExtension: z.string(),
});

// TODO: update image for user in DB
// export const UpdateProfileImageInput = z.object({
//   userId: z.uuid(),
//   imageUrl: z.string(),
// });
