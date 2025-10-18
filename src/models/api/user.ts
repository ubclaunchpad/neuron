import { z } from "zod";

export const UserIdInput = z.object({
  userId: z.uuid(),
});

export const GetPresignedUrlInput = z.object({
  userId: z.uuid(),
  fileExtension: z.string(),
});

export const UpdateProfileImageInput = z.object({
  userId: z.uuid(),
  imageUrl: z.string(),
});