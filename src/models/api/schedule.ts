import { createStringEnum } from "@/utils/typeUtils";
import { z } from "zod";

export const ScheduleTypeEnum = z.enum(["single", "weekly", "monthly"] as const);
export type ScheduleType = z.infer<typeof ScheduleTypeEnum>;
export const ScheduleType = createStringEnum(ScheduleTypeEnum);

const WeekdayEnum = z.enum({
  "Sunday": "SU",
  "Monday": "MO",
  "Tuesday": "TU",
  "Wednesday": "WE",
  "Thursday": "TH",
  "Friday": "FR",
  "Saturday": "SA",
} as const);
export type Weekday = z.infer<typeof WeekdayEnum>;
export const Weekday = createStringEnum(WeekdayEnum);

export const ScheduleIdInput = z.object({
  scheduleId: z.uuid(),
});
export type ScheduleIdInput = z.infer<typeof ScheduleIdInput>;

const WeeklyRule = z.object({
  type: z.literal(ScheduleType.weekly),
  weekday: WeekdayEnum,
  interval: z.number().int().min(1).default(1),
  localStartTime: z.iso.time(),
  tzid: z.string(),
});
export type WeeklyRule = z.infer<typeof WeeklyRule>;

const MonthlyRule = z.object({
  type: z.literal(ScheduleType.monthly),
  weekday: WeekdayEnum,
  nth: z.number().int().min(1).max(5),
  localStartTime: z.iso.time(),
  tzid: z.string(),
});
export type MonthlyRule = z.infer<typeof MonthlyRule>;

const SingleRule = z.object({
  type: z.literal(ScheduleType.single),
  extraDates: z.array(z.iso.date()).min(1),
  localStartTime: z.iso.time(),
  tzid: z.string(),
});
export type SingleRule = z.infer<typeof SingleRule>;

const ScheduleRule = z.discriminatedUnion("type", [
  WeeklyRule,
  MonthlyRule,
  SingleRule,
]);
export type ScheduleRule = z.infer<typeof ScheduleRule>;

export const CreateScheduleInput = z.object({
  durationMinutes: z.number().int().positive().max(32767),
  volunteerUserIds: z.array(z.uuid()).default([]),
  instructorUserIds: z.array(z.uuid()).default([]),
  effectiveStart: z.iso.date().optional(),
  effectiveEnd: z.iso.date().optional(),
  rule: ScheduleRule,
});
export type CreateScheduleInput = z.infer<typeof CreateScheduleInput>;

export const UpdateScheduleInput = z.object({
  scheduleId: z.uuid(),
  durationMinutes: z.number().int().positive().optional(),
  addedVolunteerUserIds: z.array(z.uuid()).optional(),
  removedVolunteerUserIds: z.array(z.uuid()).optional(),
  addedInstructorUserIds: z.array(z.uuid()).optional(),
  removedInstructorUserIds: z.array(z.uuid()).optional(),
  effectiveStart: z.iso.date().optional(),
  effectiveEnd: z.iso.date().optional(),
  rule: ScheduleRule.optional(), // If provided, need to provide full rule in case they switch types
});
export type UpdateScheduleInput = z.infer<typeof UpdateScheduleInput>;