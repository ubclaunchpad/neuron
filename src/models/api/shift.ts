import { z } from "zod";
import { CoverageStatusEnum } from "./coverage";

export const GetShiftsInput = z.object({
  userId: z.uuid().optional(),
  before: z.iso.datetime().optional(),
  after: z.iso.datetime().optional(),
  status: CoverageStatusEnum.optional(),  
  limit: z.number().min(1).max(100).default(20),
  cursor: z.iso.datetime().optional(), // ISO datetime string for cursor
  direction: z.enum(["forward", "backward"]).default("forward"),
});
export type GetShiftsInput = z.infer<typeof GetShiftsInput>;

export const ShiftIdInput = z.object({
  shiftId: z.uuid(),
});
export type ShiftIdInput = z.infer<typeof ShiftIdInput>;

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
