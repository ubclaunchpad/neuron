import type { CourseDB, ScheduleDB } from "@/server/db/schema";
import { type Instructor, getEmbeddedInstructor } from "./instructor";
import type { Term } from "./term";
import { type Volunteer, getEmbeddedVolunteer } from "./volunteer";

export type Class = {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  image?: string;
  published: boolean;
  meetingURL?: string;
  category?: string;
  subcategory?: string;
  schedules: Schedule[];
  createdAt: Date;
  updatedAt: Date;
};

export function buildClass(
  classDB: CourseDB,
  schedules: Schedule[] = [],
): Class {
  return {
    id: classDB.id,
    name: classDB.name,
    description: classDB.description ?? undefined,
    startDate: classDB.startDate,
    endDate: classDB.endDate,
    image: classDB.image ?? undefined,
    published: classDB.published,
    meetingURL: classDB.meetingURL ?? undefined,
    category: classDB.category ?? undefined,
    subcategory: classDB.subcategory ?? undefined,
    schedules: schedules,
    createdAt: classDB.createdAt,
    updatedAt: classDB.updatedAt,
  } as const;
}

export function getSingleClass(c: Class) {
  return {
    id: c.id,
    name: c.name,
    description: c.description,
    startDate: c.startDate,
    endDate: c.endDate,
    image: c.image,
    published: c.published,
    meetingURL: c.meetingURL,
    category: c.category,
    subcategory: c.subcategory,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    schedules: c.schedules.map(getSingleSchedule),
  } as const;
}

export function getListClass(c: Class) {
  return {
    id: c.id,
    name: c.name,
    image: c.image,
    category: c.category,
    subcategory: c.subcategory,
    schedules: c.schedules.map(getEmbeddedSchedule),
  } as const;
}

export type Schedule = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  durationMinutes: number;
  intervalWeeks: number;
  weekOffset: number;
  instructor?: Instructor;
  volunteers: Volunteer[];
};

export function buildSchedule(
  scheduleDB: ScheduleDB,
  instructor?: Instructor,
  volunteers: Volunteer[] = [],
): Schedule {
  return {
    id: scheduleDB.id,
    dayOfWeek: scheduleDB.dayOfWeek,
    startTime: scheduleDB.startTime,
    durationMinutes: scheduleDB.durationMinutes,
    intervalWeeks: scheduleDB.intervalWeeks,
    weekOffset: scheduleDB.weekOffset,
    volunteers: volunteers,
    instructor: instructor,
  } as const;
}

export function getSingleSchedule(s: Schedule) {
  return {
    id: s.id,
    dayOfWeek: s.dayOfWeek,
    startTime: s.startTime,
    durationMinutes: s.durationMinutes,
    intervalWeeks: s.intervalWeeks,
    weekOffset: s.weekOffset,
    volunteers: s.volunteers.map(getEmbeddedVolunteer),
    instructor: s.instructor ? getEmbeddedInstructor(s.instructor) : undefined,
  } as const;
}

export function getEmbeddedSchedule(s: Schedule) {
  return {
    id: s.id,
    dayOfWeek: s.dayOfWeek,
    startTime: s.startTime,
    durationMinutes: s.durationMinutes,
    intervalWeeks: s.intervalWeeks,
    weekOffset: s.weekOffset,
  } as const;
}

export type ClassResponse<C> = {
  classes: C[];
  term: Term
};

export type SingleClass = ReturnType<typeof getSingleClass>;
export type ListClass = ReturnType<typeof getListClass>;
export type SingleSchedule = ReturnType<typeof getSingleSchedule>;
export type EmbeddedSchedule = ReturnType<typeof getEmbeddedSchedule>;
