import { createStringEnum } from "@/utils/typeUtils";
import { z } from "zod";

export const RoleEnum = z.enum(["admin", "instructor", "volunteer"] as const);
export type Role = z.infer<typeof RoleEnum>;
export const Role = createStringEnum(RoleEnum);

export const StatusEnum = z.enum(["pending", "active", "inactive"] as const);
export type Status = z.infer<typeof StatusEnum>;
export const Status = createStringEnum(StatusEnum);

export const CoverageStatusEnum = z.enum([
  "open",
  "withdrawn",
  "resolved",
] as const);
export type CoverageStatus = z.infer<typeof CoverageStatusEnum>;
export const CoverageStatus = createStringEnum(CoverageStatusEnum);

export const AbsenceRequestCategoryEnum = z.enum([
  "emergency",
  "health",
  "conflict",
  "transportation",
  "other",
] as const);
export type AbsenceRequestCategory = z.infer<typeof AbsenceRequestCategoryEnum>;
export const AbsenceRequestCategory = createStringEnum(AbsenceRequestCategoryEnum);

export const AttendanceStatusEnum = z.enum([
  "present",
  "absent",
  "excused",
  "late",
] as const);
export type AttendanceStatus = z.infer<typeof AttendanceStatusEnum>;
export const AttendanceStatus = createStringEnum(AttendanceStatusEnum);

export const ScheduleTypeEnum = z.enum(["single", "rrule"] as const);
export type ScheduleType = z.infer<typeof ScheduleTypeEnum>;
export const ScheduleType = createStringEnum(ScheduleTypeEnum);