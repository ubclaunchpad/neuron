import { z } from "zod";

export const TermIdInput = z.object({
  termId: z.uuid(),
});

export const CreateTermInput = z.object({
  name: z.string().min(1),
  startDate: z.iso.date(),
  endDate: z.iso.date(),
  holidays: z.array(
      z.object({
        startsOn: z.string().date(),
        endsOn: z.string().date(),
      }),
    ).optional(),
});
export type CreateTermInput = z.infer<typeof CreateTermInput>;
