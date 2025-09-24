import { z } from "zod";
import { CreateScheduleInput, UpdateScheduleInput } from "./schedule";

export const ClassIdInput = z.object({
  classId: z.uuid(),
});
export type ClassIdInput = z.infer<typeof ClassIdInput>;

export const CreateClassInput = z.object({
  termId: z.uuid(),
  image: z.url().optional(),
  name: z.string().min(1),
  instructions: z.string().optional(),
  meetingURL : z.url().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  schedules: z.array(CreateScheduleInput).default([]),
});
export type CreateClassInput = z.infer<typeof CreateClassInput>;

export const UpdateClassInput = z.object({
  id: z.uuid(),
  image: z.url().optional(),
  classname: z.string().optional(),
  instructions: z.string().nullish(),
  meetingURL: z.url().nullish(),
  category: z.string().nullish(),
  subcategory: z.string().nullish(),
  addedSchedules: z.array(CreateScheduleInput).default([]),
  updatedSchedules: z.array(UpdateScheduleInput).default([]),
  deletedSchedules: z.array(z.uuid()).default([]),
});
export type UpdateClassInput = z.infer<typeof UpdateClassInput>;

export const ClassRequest = z.object({
  term: z.uuid().or(z.literal("current")),
});
export type ClassRequest = z.infer<typeof ClassRequest>;