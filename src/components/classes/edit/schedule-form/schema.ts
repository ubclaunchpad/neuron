import { ScheduleType, WeekdayEnum } from "@/models/api/schedule";
import type { Control } from "react-hook-form";
import z from "zod";

const Single = z.object({
  type: z.literal("single"),
  extraDates: z.array(z.iso.date("Please fill out this field.")).min(1),
});

const Weekly = z.object({
  type: z.literal("weekly"),
  weekday: z
    .string("Please select a weekday.")
    .min(1, "Please select a weekday.")
    .pipe(WeekdayEnum),
  interval: z.coerce
    .number("Please fill out this field.")
    .int("Please enter only whole numbers.")
    .min(1, "Interval must be at least 1."),
});

const Monthly = z.object({
  type: z.literal("monthly"),
  weekday: z
    .string("Please select a weekday.")
    .min(1, "Please select a weekday.")
    .pipe(WeekdayEnum),
  nth: z.coerce
    .number("Please fill out this field.")
    .int("Please enter only whole numbers.")
    .min(1)
    .max(5),
});

export const ScheduleRuleEditSchema = z.discriminatedUnion("type", [
  Single,
  Weekly,
  Monthly,
]);

export type ScheduleRuleEditSchemaType = z.infer<typeof ScheduleRuleEditSchema>;

export const UserSchema = z.object({
  id: z.uuid(),
  label: z.string("Please fill out this field."),
  email: z.string("Please fill out this field."),
});

export const ScheduleEditSchema = z.object({
  id: z.uuid().optional(),
  localStartTime: z.iso.time("Please fill out this field."),
  localEndTime: z.iso.time("Please fill out this field."),
  volunteers: z.array(UserSchema),
  preferredVolunteerCount: z.coerce
    .number<any>("Please fill out the preferred number of volunteers.")
    .int("Please enter only whole numbers.")
    .min(1, "The preferred volunteer count must be at least 1"),
  instructors: z.array(UserSchema),
  effectiveStart: z.iso.date().optional(),
  effectiveEnd: z.iso.date().optional(),
  rule: ScheduleRuleEditSchema,
});

export type ScheduleEditSchemaInput = z.input<typeof ScheduleEditSchema>;
export type ScheduleEditSchemaOutput = z.output<typeof ScheduleEditSchema>;

export type ScheduleFormControl = Control<
  ScheduleEditSchemaInput,
  any,
  ScheduleEditSchemaOutput
>;
