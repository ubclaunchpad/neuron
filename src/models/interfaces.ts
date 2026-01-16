import { StringEnum } from "@/lib/base-enum";
import { createStringEnum } from "@/utils/typeUtils";
import { z } from "zod";

export const RoleEnum = z.enum(["admin", "instructor", "volunteer"] as const);
export type Role = z.infer<typeof RoleEnum>;
export const Role = StringEnum.createFromType<Role>({
  admin: "Admin",
  instructor: "Instructor",
  volunteer: "Volunteer",
});

export const UserStatusEnum = z.enum([
  "unverified",
  "rejected",
  "active",
  "inactive",
] as const);
export type UserStatus = z.infer<typeof UserStatusEnum>;
export const UserStatus = StringEnum.createFromType<UserStatus>({
  unverified: "Unverified",
  rejected: "Rejected",
  active: "Active",
  inactive: "Disabled",
});

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
