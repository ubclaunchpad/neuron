import { z } from "zod";

export const ProfileSchema = z.object({
  firstName: z.string().nonempty("Please enter your first name."),
  lastName: z.string().nonempty("Please enter your last name."),
  email: z
    .string()
    .email("Please enter a valid email address.")
    .nonempty("Email is required."),
  preferredName: z.string().optional(),
  pronouns: z.string().optional(),
  bio: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  image: z.string().nullable(),
});

export type ProfileSchemaType = z.infer<typeof ProfileSchema>;