import { normalizeEmail } from "@/utils/emailUtils";
import { z } from "zod";

export const NormalizedEmail = z
  .string()
  .trim()
  .pipe(z.email("Please enter a valid email address."))
  .transform(normalizeEmail);
