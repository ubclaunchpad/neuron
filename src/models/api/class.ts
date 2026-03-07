import { z } from "zod";
import { CreateSchedule, UpdateSchedule } from "./schedule";

export const ClassIdInput = z.object({
  classId: z.uuid(),
});
export type ClassIdInput = z.input<typeof ClassIdInput>;

export const CreateClass = z.object({
  termId: z.uuid(),
  image: z.string().optional(),
  name: z.string().nonempty(),
  description: z.string().optional(),
  meetingURL : z.url().optional(),
  lowerLevel: z.int().min(1).max(4).nullish(),
  upperLevel: z.int().min(1).max(4).nullish(),
  category: z.string(),
  subcategory: z.string().optional(),
  schedules: z.array(CreateSchedule).default([]),
}).refine(
  (val) => (val.lowerLevel == null) === (val.upperLevel == null),
  { message: "Both levels must be provided or both must be empty", path: ["lowerLevel"] },
);
export type CreateClassInput = z.input<typeof CreateClass>;
export type CreateClassOutput= z.output<typeof CreateClass>;

export const UpdateClass = z.object({
  id: z.uuid(),
  image: z.string().nullish(),
  name: z.string().optional(),
  description: z.string().nullish(),
  meetingURL: z.url().nullish(),
  category: z.string().optional(),
  subcategory: z.string().nullish(),
  lowerLevel: z.int().nullish(),
  upperLevel: z.int().nullish(),
  addedSchedules: z.array(CreateSchedule).default([]),
  updatedSchedules: z.array(UpdateSchedule).default([]),
  deletedSchedules: z.array(z.uuid()).default([]),
}).refine(
  (val) => (val.lowerLevel == null) === (val.upperLevel == null),
  { message: "Both levels must be provided or both must be empty", path: ["lowerLevel"] },
);
export type UpdateClassInput = z.input<typeof UpdateClass>;
export type UpdateClassOutput = z.output<typeof UpdateClass>;

export const ClassRequest = z.object({
  term: z.uuid().or(z.literal("current")),
});
export type ClassRequest = z.input<typeof ClassRequest>;