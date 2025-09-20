import { Uuid } from "@/models/api/common";
import { z } from "zod";

export const InstructorIdInput = z.object({
  instructorId: Uuid,
});

export const CreateInstructorInput = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  signoff: z.string(),
});

export const UpdateInstructorInput = z.object({
  instructorId: Uuid,
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  signoff: z.string(),
});

export const DeleteInstructorInput = z.object({
  instructorId: Uuid,
  signoff: z.string(),
});
