import { AbsenceRequestCategoryEnum, CoverageStatusEnum } from "@/models/interfaces";
import { z } from "zod";

export const GetShiftsInput = z.object({
  volunteerUserId: z.uuid().optional(),
  before: z.iso.datetime().optional(),
  after: z.iso.datetime().optional(),
  status: CoverageStatusEnum.optional(),
});

export const ShiftIdInput = z.object({
  shiftId: z.uuid(),
});

export const AbsenceRequestInput = z.object({
  details: z.string(),
  comments: z.string().optional(),
  category: AbsenceRequestCategoryEnum,
});

export const CreateShiftInput = z.object({
  courseId: z.uuid(),
  scheduleId: z.uuid(),
  date: z.iso.date(),
  startAt: z.iso.datetime(),
  endAt: z.iso.datetime(),
});
export type CreateShiftInput = z.infer<typeof CreateShiftInput>;
