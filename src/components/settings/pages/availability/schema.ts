import { z } from "zod";
import { AVAILABILITY_SLOTS } from "@/constants";
import type { Control } from "react-hook-form";

export const AvailabilitySchema = z.object({
  availability: z
    .string()
    .length(
      AVAILABILITY_SLOTS,
      `Availability must be exactly ${AVAILABILITY_SLOTS} characters`,
    )
    .regex(/^[01]+$/, "Availability must only contain 0s and 1s"),
  preferredTimeCommitment: z.coerce
    .number()
    .int("Please enter a whole number.")
    .min(0, "Must be 0 or more hours.")
    .max(168, "Cannot exceed 168 hours per week."),
});

export type AvailabilitySchemaInput = z.input<typeof AvailabilitySchema>;
export type AvailabilitySchemaOutput = z.output<typeof AvailabilitySchema>;

export type AvailabilityFormControl = Control<
  AvailabilitySchemaInput,
  any,
  AvailabilitySchemaOutput
>;