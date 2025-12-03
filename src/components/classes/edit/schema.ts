import { asNullishField } from "@/components/form/utils/zod-form-utils";
import type { UpdateClassInput } from "@/models/api/class";
import z from "zod";
import { ScheduleEditSchema } from "./schedule-form/schema";

export type ClassFormValues = Omit<UpdateClassInput, "id">;

export const ClassEditSchema = z
  .object({
    name: z.string().nonempty("Please fill out this field."),
    description: asNullishField(z.string()),
    meetingURL: asNullishField(z.url("Please enter a valid meeting url.")),
    category: z.string().nonempty("Please fill out this field."),
    subcategory: asNullishField(z.string()),
    levelRange: z.array(z.int().min(1).max(4)).length(2),
    schedules: z.array(ScheduleEditSchema),
    image: z.string().nullable(),
  })
  .refine((val) => val.levelRange[0]! <= val.levelRange[1]!, {
    error: "The upper level must be greater than the lower level",
    path: ["levelRange"],
  });
export type ClassEditSchemaType = z.infer<typeof ClassEditSchema>;
export type ClassEditSchemaInput = z.input<typeof ClassEditSchema>;
export type ClassEditSchemaOutput = z.output<typeof ClassEditSchema>;
