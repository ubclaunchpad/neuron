import { AVAILABILITY_SLOTS } from "@/constants";
import { DateYMD, Uuid } from "@/models/api/common";
import { zodBitString } from "@/models/extensions/zodBitString";
import { ZodPhoneNumber } from "@/models/extensions/zodPhoneNumber";
import { z } from "zod";

export const GetVolunteersInput = z.object({ 
    unverified: z.boolean().optional() 
});

export const ShiftCheckInInput = z.object({
    scheduleId: z.number().int().nonnegative(),
    shiftDate: DateYMD,
});

export const VolunteerIdInput = z.object({ 
    volunteerUserId: Uuid 
});

export const UpdateVolunteerInput = z.object({
    volunteerUserId: Uuid,
    preferredName: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    totalHours: z.number().int().optional(),
    bio: z.string().optional(),
    pronouns: z.any().optional(),
    email: z.string().email().optional(),
    active: z.number().int().optional(),
    phoneNumber: ZodPhoneNumber.optional(),
    city: z.string().optional(),    
    province: z.string().optional(),
    preferredTimeCommitment: z.number().int().min(0).optional(),
    availability: zodBitString(AVAILABILITY_SLOTS).optional(),
});

export const AdminSignoffInput = z.object({ 
    signoff: z.string()
});