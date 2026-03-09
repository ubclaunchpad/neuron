import type { LocationType } from "@/models/api/class";
import type { CourseDB } from "@/server/db/schema";
import {
  getEmbeddedSchedule,
  getSingleSchedule,
  type Schedule,
} from "./schedule";
import type { Term } from "./term";

export type Class = {
  id: string;
  termId: string;
  name: string;
  description?: string;
  image?: string;
  published: boolean;
  location?: string;
  locationType?: LocationType;
  category: string;
  subcategory?: string;
  lowerLevel: number | null;
  upperLevel: number | null;
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
    location: classDB.location ?? undefined,
    locationType: classDB.locationType ?? undefined,
    category: classDB.category,
    subcategory: classDB.subcategory ?? undefined,
    lowerLevel: classDB.lowerLevel,
    upperLevel: classDB.upperLevel,
    schedules: schedules,
    createdAt: classDB.createdAt,
    updatedAt: classDB.updatedAt,
  } as const;
}

export function getSingleClass(c: Class) {
  return {
    id: c.id,
    termId: c.termId,
    name: c.name,
    description: c.description,
    image: c.image,
    published: c.published,
    location: c.location,
    locationType: c.locationType,
    category: c.category,
    subcategory: c.subcategory,
    lowerLevel: c.lowerLevel,
    upperLevel: c.upperLevel,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    schedules: c.schedules.map(getSingleSchedule),
  } as const;
}

export function getEmbeddedClass(c: Class | CourseDB) {
  return {
    id: c.id,
    name: c.name,
    termId: c.termId,
    image: c.image,
    description: c.description,
    location: c.location,
    locationType: c.locationType,
    category: c.category,
    subcategory: c.subcategory,
  } as const;
}

export function getListClass(c: Class) {
  return {
    id: c.id,
    name: c.name,
    image: c.image,
    category: c.category,
    subcategory: c.subcategory,
    lowerLevel: c.lowerLevel,
    upperLevel: c.upperLevel,
    schedules: c.schedules.map(getEmbeddedSchedule),
  } as const;
}

export type ClassResponse<C> = {
  classes: C[];
  term: Term;
};

export type SingleClass = ReturnType<typeof getSingleClass>;
export type EmbeddedClass = ReturnType<typeof getEmbeddedClass>;
export type ListClass = ReturnType<typeof getListClass>;
