import { z } from "zod";

export const GetShiftsInput = z.object({
  cursor: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Cursor must be in YYYY-MM format"),
  userId: z.uuid().optional(),
  scheduleId: z.uuid().optional(),
  courseId: z.uuid().optional(),
});
export type GetShiftsInput = z.infer<typeof GetShiftsInput>;

export const ShiftIdInput = z.object({
  shiftId: z.uuid(),
});
export type ShiftIdInput = z.infer<typeof ShiftIdInput>;

export const CheckInInput = ShiftIdInput.extend({
  volunteerId: z.uuid().optional(),
});
export type CheckInInput = z.infer<typeof CheckInInput>;

export const CancelShiftInput = ShiftIdInput.extend({
  cancelReason: z.string(),
});
export type CancelShiftInput = z.infer<typeof CancelShiftInput>;

export const AbsenceRequestInput = z.object({
  details: z.string(),
  comments: z.string().optional(),
});

export const CreateShiftInput = z.object({
  scheduleId: z.uuid(),
  date: z.iso.date(),
  startAt: z.iso.datetime(),
  endAt: z.iso.datetime(),
});
export type CreateShiftInput = z.infer<typeof CreateShiftInput>;
