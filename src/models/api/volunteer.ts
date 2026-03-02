import { AVAILABILITY_SLOTS } from "@/constants";
import { BitString } from "@/models/extensions/BitString";
import { z } from "zod";

export const GetVolunteersInput = z.object({
  unverified: z.boolean().optional(),
  page: z.number().int().optional(),
  perPage: z.number().int().optional(),
  queryInput: z.string().optional(),
});

export const ShiftCheckInInput = z.object({
  scheduleId: z.uuid(),
  shiftId: z.uuid(),
});

export const UpdateVolunteerProfileInput = z.object({
  volunteerUserId: z.uuid(),
  preferredName: z.string().optional(),
  bio: z.string().optional(),
  pronouns: z.string().optional(),
  phoneNumber: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
});

export const UpdateVolunteerAvailabilityInput = z.object({
  volunteerUserId: z.uuid(),
  availability: BitString(AVAILABILITY_SLOTS),
  preferredTimeCommitmentHours: z.number().int().min(0).optional(),
});

export const AdminSignoffInput = z.object({
  signoff: z.string(),
});