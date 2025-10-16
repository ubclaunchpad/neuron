import { z } from "zod";

export const UserIdInput = z.object({
  userId: z.uuid(),
});

export const GetPresignedUrlInput = z.object({
  fileType: z.string(),
});

export const UpdateProfileImageInput = z.object({
  userId: z.uuid(),
  imageUrl: z.string().refine((val) => {
    // Allow both regular URLs and blob URLs
    try {
      new URL(val);
      return true;
    } catch {
      return false;
    }
  }, "Invalid URL format"),
});