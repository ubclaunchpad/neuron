import { z } from "zod";

export const GeneralProfileSchema = z.object({
  firstName: z.string().nonempty("Please enter your first name."),
  lastName: z.string().nonempty("Please enter your last name."),
  email: z.string().email("Please enter a valid email address."),
  image: z.string().nullable(),
});

export type GeneralProfileSchemaType = z.infer<typeof GeneralProfileSchema>;
