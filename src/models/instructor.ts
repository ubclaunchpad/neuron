import type { InstructorUserViewDB } from "@/server/db/schema";
import type { Status } from "./interfaces";

export type Instructor = {
  id: string;
  name: string;
  lastName: string;
  email: string;
  status: Status;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
};

export function buildInstructor(
  instructorDB: InstructorUserViewDB,
): Instructor {
  return {
    id: instructorDB.id,
    name: instructorDB.name,
    lastName: instructorDB.lastName,
    email: instructorDB.email,
    status: instructorDB.status,
    image: instructorDB.image ?? undefined,
    createdAt: instructorDB.createdAt,
    updatedAt: instructorDB.updatedAt,
  } as const;
}

export function getListInstructor(i: Instructor) {
  return {
    id: i.id,
    name: i.name,
    lastName: i.lastName,
    email: i.email,
    image: i.image,
  } as const;
}

export function getEmbeddedInstructor(i: Instructor) {
  return {
    id: i.id,
    name: i.name,
    lastName: i.lastName,
    email: i.email,
    image: i.image,
  } as const;
}

export type ListInstructor = ReturnType<typeof getListInstructor>;
export type EmbeddedInstructor = ReturnType<typeof getEmbeddedInstructor>;
