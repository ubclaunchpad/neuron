import { DateYMD, Time24, Uuid } from "@/models/api/common";
import { z } from "zod";

export const ScheduleIdInput = z.object({
  scheduleId: Uuid,
});
export type ScheduleIdInput = z.infer<typeof ScheduleIdInput>;

export const CreateScheduleInput = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: Time24,
  durationMinutes: z.number().int().min(1),
  intervalWeeks: z.number().int().min(1).max(2),
  weekOffset: z.number().int().min(0).max(1),
  volunteerUserIds: z.array(Uuid).default([]),
  instructorUserId: Uuid.optional(),
});
export type CreateScheduleInput = z.infer<typeof CreateScheduleInput>;

export const UpdateScheduleInput = z.object({
  scheduleId: Uuid,
  day: z.number().int().min(0).max(6).optional(),
  startTime: Time24.optional(),
  durationMinutes: z.number().int().min(1).optional(),
  intervalWeeks: z.number().int().min(1).max(2).optional(),
  weekOffset: z.number().int().min(0).max(1).optional(),
  addedVolunteerUserIds: z.array(Uuid).optional(),
  removedVolunteerUserIds: z.array(Uuid).optional(),
  instructorUserId: Uuid.optional(),
});
export type UpdateScheduleInput = z.infer<typeof UpdateScheduleInput>;

export const ClassIdInput = z.object({
  classId: Uuid,
});
export type ClassIdInput = z.infer<typeof ClassIdInput>;

export const CreateClassInput = z.object({
  termId: Uuid,
  image: z.string().url().optional(),
  name: z.string().min(1),
  instructions: z.string().optional(),
  zoomLink: z.string().url().optional(),
  startDate: DateYMD,
  endDate: DateYMD,
  category: z.string().optional(),
  subcategory: z.string().optional(),
  schedules: z.array(CreateScheduleInput).default([]),
});
export type CreateClassInput = z.infer<typeof CreateClassInput>;

export const UpdateClassInput = z.object({
  id: Uuid,
  image: z.string().url().optional(),
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
export type UpdateClassInput = z.infer<typeof UpdateClassInput>;

export const ClassRequest = z.object({
  term: z.string().uuid().or(z.literal("current")),
});
export type ClassRequest = z.infer<typeof ClassRequest>;