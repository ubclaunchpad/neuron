import { z } from "zod";

export const SubmitBugReportInput = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().min(1, "Description is required").max(5000),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
});
