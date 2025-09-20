import { z } from "zod";
import { DateYMD, Uuid } from "./common";

export const TermIdInput = z.object({
  termId: Uuid,
});

export const CreateTermInput = z.object({
  name: z.string().min(1),
  startDate: DateYMD,
  endDate: DateYMD,
});
export type CreateTermInput = z.infer<typeof CreateTermInput>;