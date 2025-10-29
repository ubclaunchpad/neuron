import { z } from "zod";

export const TermIdInput = z.object({
  termId: z.uuid(),
});

const Holiday = z.object({
  startsOn: z.iso.date(),
  endsOn: z.iso.date(),
});
export type Holiday = z.infer<typeof Holiday>;

const UpdatedHoliday = z.object({
  id: z.uuid(),
  startsOn: z.iso.date().optional(),
  endsOn: z.iso.date().optional()
});
export type UpdatedHoliday = z.infer<typeof UpdatedHoliday>;

export const CreateTermInput = z.object({
  name: z.string().min(1),
  startDate: z.iso.date(),
  endDate: z.iso.date(),
  holidays: z.array(Holiday).default([]),
});
export type CreateTermInput = z.infer<typeof CreateTermInput>;

export const UpdateTermInput = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  startDate: z.iso.date().optional(),
  endDate: z.iso.date().optional(),
  addedHolidays: z.array(Holiday).default([]),
  updatedHolidays: z.array(UpdatedHoliday).default([]),
  deletedHolidays: z.array(z.string()).default([]),
});
export type UpdateTermInput = z.infer<typeof UpdateTermInput>;