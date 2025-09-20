import { z } from "zod";

export const GetLogsInput = z.object({
  q: z.string().optional(),
  page: z.number().int().optional(),
  perPage: z.number().int().optional(),
});
