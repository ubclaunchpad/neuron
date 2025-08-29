import { DateYMD, Time24, Uuid } from "@/models/api/common";
import { FrequencyEnum } from "@/models/interfaces";
import { z } from "zod";

export const ScheduleIdInput = z.object({
    scheduleId: Uuid,
});

export const CreateScheduleInput = z.object({
    day: z.number().int().min(0).max(6),
    startTime: Time24,
    endTime: Time24,
    frequency: FrequencyEnum,
    volunteerUserIds: z.array(Uuid).default([]),
    instructorUserId: Uuid.optional(),
});

export const UpdateScheduleInput = z.object({
    scheduleId: Uuid,
    day: z.number().int().min(0).max(6).optional(),
    startTime: Time24.optional(),
    endTime: Time24.optional(),
    frequency: FrequencyEnum.optional(),
    volunteerUserIds: z.array(Uuid).optional(),
    instructorUserId: Uuid.optional(),
});

export const ClassIdInput = z.object({
    classId: Uuid,
});

export const CreateClassInput = z.object({
    classname: z.string().min(1),
    instructions: z.string().optional(),
    zoomLink: z.string().url().optional(),
    startDate: DateYMD,
    endDate: DateYMD,
    category: z.string().optional(),
    subcategory: z.string().optional(),
    schedules: z.array(CreateScheduleInput).default([]),
});

export const UpdateClassInput = z.object({
    classId: Uuid,
    classname: z.string().optional(),
    instructions: z.string().nullish(),
    zoomLink: z.string().url().nullish(),
    startDate: DateYMD.optional(),  
    endDate: DateYMD.optional(),
    category: z.string().nullish(),
    subcategory: z.string().nullish(),
    addedSchedules: z.array(CreateScheduleInput).default([]),
    updatedSchedules: z.array(UpdateScheduleInput).default([]),
    deletedSchedules: z.array(Uuid).default([]),
});