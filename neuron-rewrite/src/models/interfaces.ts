import { createStringEnum } from "@/utils/typeUtils";
import { z } from "zod";

export const RoleEnum = z.enum([
    'admin', 
    'instructor', 
    'volunteer'
] as const);
export type Role = z.infer<typeof RoleEnum>;    
export const Role = createStringEnum(RoleEnum);

export const StatusEnum = z.enum([
    'pending', 
    'active', 
    'inactive'
] as const);
export type Status = z.infer<typeof StatusEnum>;
export const Status = createStringEnum(StatusEnum);

export const ShiftStatusEnum = z.enum([
    'absence-pending', 
    'open', 
    'coverage-pending', 
    'resolved'
] as const);
export type ShiftStatus = z.infer<typeof ShiftStatusEnum>;
export const ShiftStatus = createStringEnum(ShiftStatusEnum);

export const ShiftQueryTypeEnum = z.enum([
    'coverage', 
    'absence'
] as const);
export type ShiftQueryType = z.infer<typeof ShiftQueryTypeEnum>;
export const ShiftQueryType = createStringEnum(ShiftQueryTypeEnum);

export const FrequencyEnum = z.enum([
    'once', 
    'weekly', 
    'biweekly'
] as const);
export type Frequency = z.infer<typeof FrequencyEnum>;
export const Frequency = createStringEnum(FrequencyEnum);

export const AbsenceRequestCategoryEnum = z.enum([
    'emergency', 
    'health', 
    'conflict', 
    'transportation', 
    'other'
] as const);
export type AbsenceRequestCategory = z.infer<typeof AbsenceRequestCategoryEnum>;
export const AbsenceRequestCategory = createStringEnum(AbsenceRequestCategoryEnum);
