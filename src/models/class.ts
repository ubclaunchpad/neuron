import type { CourseDB } from "@/server/db/schema";
import { getEmbeddedSchedule, getSingleSchedule, type Schedule } from "./schedule";
import type { Term } from "./term";

export type Class = {
  id: string;
  termId: string;
  name: string;
  description?: string;
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
    termId: classDB.termId,
    name: classDB.name,
    description: classDB.description ?? undefined,
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

export type ClassResponse<C> = {
  classes: C[];
  term: Term
};

export type SingleClass = ReturnType<typeof getSingleClass>;
export type ListClass = ReturnType<typeof getListClass>;
