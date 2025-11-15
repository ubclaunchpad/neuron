import { z } from "zod";

export const InstructorIdInput = z.object({
  instructorId: z.uuid(),
});

export const CreateInstructorInput = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.email(),
});

export const UpdateInstructorInput = z.object({
  instructorId: z.uuid(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.email().optional(),
});

export const DeleteInstructorInput = z.object({
  instructorId: z.uuid(),
});
