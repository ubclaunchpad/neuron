import { createStringEnum } from "@/utils/typeUtils";
import { z } from "zod";
import { CreateSchedule, UpdateSchedule } from "./schedule";

export const LocationTypeEnum = z.enum({
  InPerson: "InPerson",
  MeetingLink: "MeetingLink",
} as const);
export type LocationType = z.infer<typeof LocationTypeEnum>;
export const LocationType = createStringEnum(LocationTypeEnum);

export const ClassIdInput = z.object({
  classId: z.uuid(),
});
export type ClassIdInput = z.input<typeof ClassIdInput>;

export const CreateClass = z.object({
  termId: z.uuid(),
  image: z.string().optional(),
  name: z.string().nonempty(),
  description: z.string().optional(),
  location: z.string().optional(),
  locationType: LocationTypeEnum.optional(),
  lowerLevel: z.int().min(1).max(4).nullish(),
  upperLevel: z.int().min(1).max(4).nullish(),
  category: z.string(),
  subcategory: z.string().optional(),
  schedules: z.array(CreateSchedule).default([]),
}).refine(
  (val) => (val.lowerLevel == null) === (val.upperLevel == null),
  { message: "Both levels must be provided or both must be empty", path: ["lowerLevel"] },
).refine(
  (val) => {
    if (val.locationType === LocationType.MeetingLink && !!val.location?.trim()) {
      return z.url().safeParse(val.location).success;
    }
    return true;
  },
  { message: "Please enter a valid meeting URL.", path: ["location"] },
);
export type CreateClassInput = z.input<typeof CreateClass>;
export type CreateClassOutput = z.output<typeof CreateClass>;

export const UpdateClass = z.object({
  id: z.uuid(),
  image: z.string().nullish(),
  name: z.string().optional(),
  description: z.string().nullish(),
  location: z.string().nullish(),
  locationType: LocationTypeEnum.nullish(),
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
).refine(
  (val) => {
    if (val.locationType === LocationType.MeetingLink && !!val.location?.trim()) {
      return z.url().safeParse(val.location).success;
    }
    return true;
  },
  { message: "Please enter a valid meeting URL.", path: ["location"] },
);
export type UpdateClassInput = z.input<typeof UpdateClass>;
export type UpdateClassOutput = z.output<typeof UpdateClass>;

export const ClassRequest = z.object({
  term: z.uuid().or(z.literal("current")),
});
export type ClassRequest = z.input<typeof ClassRequest>;
