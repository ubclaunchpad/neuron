import { AbsenceRequestCategoryEnum, CoverageStatusEnum, AttendanceStatus } from "@/models/interfaces";
import { z } from "zod";

export const GetShiftsInput = z.object({
  volunteerUserId: z.uuid().optional(),
  before: z.iso.datetime().optional(),
  after: z.iso.datetime().optional(),
  status: CoverageStatusEnum.optional(),
});

export const ShiftIdInput = z.object({
  shiftId: z.uuid(),
});
export type ShiftIdInput = z.infer<typeof ShiftIdInput>;


export const AbsenceRequestInput = z.object({
  details: z.string(),
  comments: z.string().optional(),
  category: AbsenceRequestCategoryEnum,
});

export const CreateShiftInput = z.object({
  scheduleId: z.uuid(),
  date: z.iso.date(),
  startAt: z.iso.datetime(),
  endAt: z.iso.datetime(),
});
export type CreateShiftInput = z.infer<typeof CreateShiftInput>;

const shiftBaseSchema = z.object({
  id: z.string().uuid(),
  courseId: z.string().uuid(),
  courseName: z.string().optional(),
  scheduleId: z.string().uuid(),
  startAt: z.date(),
  endAt: z.date(),
  date: z.string(), // ISO date string YYYY-MM-DD
  canceled: z.boolean(),
  cancelReason: z.string().nullable(),
  canceledAt: z.date().nullable(),
});

// Embedded shift (for use in other models like course, schedule)
export const shiftEmbeddedSchema = shiftBaseSchema.pick({
  id: true,
  startAt: true,
  endAt: true,
  date: true,
  canceled: true,
});

export type ShiftEmbedded = z.infer<typeof shiftEmbeddedSchema>;

// Coverage request info for shift list
const coverageRequestInfoSchema = z.object({
  id: z.string().uuid(),
  category: AbsenceRequestCategoryEnum,
  status: CoverageStatusEnum,
  requestingVolunteerUserId: z.string().uuid().nullable(),
  coveredByVolunteerUserId: z.string().uuid().nullable(),
  details: z.string(),
});

// Attendance info for shift list
const attendanceInfoSchema = z.object({
  userId: z.string().uuid(),
  status: AttendanceStatus,
  checkedInAt: z.date().nullable(),
  minutesWorked: z.number().nullable(),
});

// Single shift with full details
export const shiftSingleSchema = shiftBaseSchema.extend({
  course: z.object({
    id: z.string().uuid(),
    name: z.string(),
    description: z.string().nullable(),
  }),
  schedule: z.object({
    id: z.string().uuid(),
    durationMinutes: z.number(),
    effectiveStart: z.string().nullable(), // ISO date string
    effectiveEnd: z.string().nullable(), // ISO date string
  }),
  coverageRequests: z.array(coverageRequestInfoSchema),
  attendance: z.array(attendanceInfoSchema),
});

export type ShiftSingle = z.infer<typeof shiftSingleSchema>;

// List shift with minimal details
export const shiftListSchema = shiftBaseSchema.extend({
  courseName: z.string(),
  // Optional: include if user has attendance record for this shift
  userAttendanceStatus: AttendanceStatus,
  // Optional: include if user has coverage request for this shift
  userCoverageRequest: coverageRequestInfoSchema.nullable().optional(),
  // Count of volunteers assigned/attending
  attendanceCount: z.number().optional(),
  // Whether shift needs coverage
  needsCoverage: z.boolean().optional(),
});

export type ShiftList = z.infer<typeof shiftListSchema>;

// Input schemas for API
export const getShiftsInputSchema = z.object({
  // Pagination
  cursor: z.string().uuid().optional(),
  limit: z.number().min(1).max(100).default(20),
  direction: z.enum(["forward", "backward"]).default("forward"),
  
  // Filters
  userId: z.string().uuid().optional(),
  startAfter: z.date().optional(),
  startBefore: z.date().optional(),
  courseId: z.string().uuid().optional(),
  
  // Optional flags
  excludeCanceled: z.boolean().default(true),
  includeAttendanceInfo: z.boolean().default(false),
  includeCoverageInfo: z.boolean().default(false),
});

export type GetShiftsInput = z.infer<typeof getShiftsInputSchema>;

export const getShiftsOutputSchema = z.object({
  items: z.array(shiftListSchema),
  nextCursor: z.string().uuid().nullable(),
  prevCursor: z.string().uuid().nullable(),
  hasMore: z.boolean(),
});

export type GetShiftsOutput = z.infer<typeof getShiftsOutputSchema>;

// Single shift input
export const getShiftInputSchema = z.object({
  id: z.string().uuid(),
});

export type GetShiftInput = z.infer<typeof getShiftInputSchema>;
