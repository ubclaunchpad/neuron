import { z } from "zod";
import { ObjectTypeEnum } from "../interfaces";

export const GetPresignedUrlInput = z.object({
  objectType: ObjectTypeEnum,
  id: z.uuid(),
  fileExtension: z.string(),
});

// TODO: update image for user in DB
// export const UpdateProfileImageInput = z.object({
//   userId: z.uuid(),
//   imageUrl: z.string(),
// });
