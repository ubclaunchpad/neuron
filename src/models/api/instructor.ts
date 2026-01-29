import { z } from "zod";

export const InstructorIdInput = z.object({
  instructorId: z.uuid(),
});
export type InstructorIdInput = z.infer<typeof InstructorIdInput>;

export const CreateInstructorInput = z.object({
  firstName: z.string().nonempty("Please fill out this field."),
  lastName: z.string().nonempty("Please fill out this field."),
  email: z.email("Please enter a valid email address."),
});
export type CreateInstructorInput = z.infer<typeof CreateInstructorInput>;

export const UpdateInstructorInput = z.object({
  instructorId: z.uuid(),
  firstName: z.string().nonempty("Please fill out this field.").optional(),
  lastName: z.string().nonempty("Please fill out this field.").optional(),
  email: z.email("Please enter a valid email address.").optional(),
});
export type UpdateInstructorInput = z.infer<typeof UpdateInstructorInput>;

export const DeleteInstructorInput = z.object({
  instructorId: z.uuid(),
});
export type DeleteInstructorInput = z.infer<typeof DeleteInstructorInput>;
