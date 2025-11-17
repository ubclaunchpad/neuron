import { createStringEnum } from "@/utils/typeUtils";
import { z } from "zod";
import { toPlainTime } from "../extensions/Transformations";

export const ScheduleTypeEnum = z.enum({
  "Single": "single",
  "Weekly": "weekly",
  "Monthly": "monthly",
} as const);
export type ScheduleType = z.infer<typeof ScheduleTypeEnum>;
export const ScheduleType = createStringEnum(ScheduleTypeEnum);

export const WeekdayEnum = z.enum({
  "Sunday": "SU",
  "Monday": "MO",
  "Tuesday": "TU",
  "Wednesday": "WE",
  "Thursday": "TH",
  "Friday": "FR",
  "Saturday": "SA",
} as const, "Please fill out this field.");
export type Weekday = z.infer<typeof WeekdayEnum>;
export const Weekday = createStringEnum(WeekdayEnum);

const WeeklyRule = z.object({
  type: z.literal(ScheduleType.weekly),
  weekday: WeekdayEnum,
  interval: z.number().int().min(1).default(1),  
});
export type WeeklyRule = z.infer<typeof WeeklyRule>;

const MonthlyRule = z.object({
  type: z.literal(ScheduleType.monthly),
  weekday: WeekdayEnum,
  nth: z.number().int().min(1).max(5),
});
export type MonthlyRule = z.infer<typeof MonthlyRule>;

const SingleRule = z.object({
  type: z.literal(ScheduleType.single),
  extraDates: z.array(z.iso.date()).min(1),
});
export type SingleRule = z.infer<typeof SingleRule>;

export const ScheduleRule = z.discriminatedUnion("type", [
  WeeklyRule,
  MonthlyRule,
  SingleRule,
]);
export type ScheduleRuleInput = z.infer<typeof ScheduleRule>;

export const CreateSchedule = z.object({
  localStartTime: z.iso.time().transform(toPlainTime),
  localEndTime: z.iso.time().transform(toPlainTime),
  volunteerUserIds: z.array(z.uuid()).default([]),
  instructorUserIds: z.array(z.uuid()).default([]),
  effectiveStart: z.iso.date().optional(),
  effectiveEnd: z.iso.date().optional(),
  rule: ScheduleRule,
});
export type CreateScheduleInput = z.infer<typeof CreateSchedule>;

export const UpdateSchedule = z.object({
  id: z.uuid(),
  localStartTime: z.iso.time().transform(toPlainTime),
  localEndTime: z.iso.time().transform(toPlainTime),
  addedVolunteerUserIds: z.array(z.uuid()).default([]),
  removedVolunteerUserIds: z.array(z.uuid()).default([]),
  addedInstructorUserIds: z.array(z.uuid()).default([]),
  removedInstructorUserIds: z.array(z.uuid()).default([]),
  effectiveStart: z.iso.date().nullish(),
  effectiveEnd: z.iso.date().nullish(),
  rule: ScheduleRule,
});
export type UpdateScheduleInput = z.infer<typeof UpdateSchedule>;