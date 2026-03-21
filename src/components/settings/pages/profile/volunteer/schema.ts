import { z } from "zod";

export const VolunteerProfileSchema = z.object({
  preferredName: z.string().optional(),
  pronouns: z.string().optional(),
  bio: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
});

export type VolunteerProfileSchemaType = z.infer<typeof VolunteerProfileSchema>;
