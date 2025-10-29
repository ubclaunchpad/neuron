import { z } from "zod";
import { CreateSchedule, UpdateSchedule } from "./schedule";

export const ClassIdInput = z.object({
  classId: z.uuid(),
});
export type ClassIdInput = z.input<typeof ClassIdInput>;

export const CreateClass = z.object({
  termId: z.uuid(),
  image: z.url().optional(),
  name: z.string().nonempty(),
  description: z.string().optional(),
  meetingURL : z.url().optional(),
  category: z.string(),
  schedules: z.array(CreateSchedule).default([]),
});
export type CreateClassInput = z.input<typeof CreateClass>;
export type CreateClassOutput= z.output<typeof CreateClass>;

export const UpdateClass = z.object({
  id: z.uuid(),
  image: z.url().optional(),
  name: z.string().optional(),
  description: z.string().nullish(),
  meetingURL: z.url().nullish(),
  category: z.string().optional(),
  addedSchedules: z.array(CreateSchedule).default([]),
  updatedSchedules: z.array(UpdateSchedule).default([]),
  deletedSchedules: z.array(z.uuid()).default([]),
});
export type UpdateClassInput = z.input<typeof UpdateClass>;
export type UpdateClassOutput = z.output<typeof UpdateClass>;

export const ClassRequest = z.object({
  term: z.uuid().or(z.literal("current")),
});
export type ClassRequest = z.input<typeof ClassRequest>;