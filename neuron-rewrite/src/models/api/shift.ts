import { DateYMD, Uuid } from "@/models/api/common";
import { AbsenceRequestCategoryEnum, ShiftQueryTypeEnum, ShiftStatusEnum } from "@/models/interfaces";
import { z } from "zod";

export const CreateShiftInput = z.object({
    volunteerUserId: Uuid,
    shiftDate: DateYMD,
    scheduleId: z.number().int().nonnegative(),
});

export const GetShiftsInput = z.object({
    volunteerUserId: Uuid.optional(),
    before: z.string().datetime().optional(),
    after: z.string().datetime().optional(),
    type: ShiftQueryTypeEnum.optional(),
    status: ShiftStatusEnum.optional(),
});

export const ShiftIdInput = z.object({ 
    shiftId: Uuid 
});

export const UpdateShiftInput = z.object({
    volunteerUserId: Uuid.optional(),
    shiftDate: DateYMD.optional(),
});

export const AbsenceRequestInput = z.object({
    details: z.string(),
    comments: z.string().optional(),
    category: AbsenceRequestCategoryEnum,
});