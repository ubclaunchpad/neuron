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

export const VolunteerIdInput = z.object({
  volunteerUserId: z.uuid(),
});

export const UpdateVolunteerAvailabilityInput = z.object({
  volunteerUserId: z.uuid(),
  availability: BitString(AVAILABILITY_SLOTS),
});

export const UpdateVolunteerProfileInput = z.object({
  volunteerUserId: z.uuid(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  preferredName: z.string().optional(),
  totalHours: z.number().int().optional(),
  bio: z.string().optional(),
  pronouns: z.any().optional(),
  email: z.string().email().optional(),
  active: z.number().int().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  preferredTimeCommitment: z.number().int().min(0).optional(),
  availability: BitString(AVAILABILITY_SLOTS).optional(),
  image: z.string().optional(),
});

export const AdminSignoffInput = z.object({
  signoff: z.string(),
});