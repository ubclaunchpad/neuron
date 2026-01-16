import type { VolunteerUserViewDB } from "@/server/db/schema";
import type { UserStatus } from "./interfaces";
import { em } from "node_modules/@fullcalendar/core/internal-common";
import { email } from "node_modules/zod/v4/core/regexes.cjs";

export type Volunteer = {
  id: string;
  role: "volunteer";
  name: string;
  lastName: string;
  preferredName?: string;
  bio?: string;
  pronouns?: string;
  phoneNumber?: string;
  city?: string;
  province?: string;
  availability?: string;
  preferredTimeCommitmentHours?: number;
  email: string;
  status: UserStatus;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
  emailVerified: boolean;
};

export function buildVolunteer(volunteerDB: VolunteerUserViewDB): Volunteer {
  return {
    id: volunteerDB.id,
    role: "volunteer",
    name: volunteerDB.name,
    lastName: volunteerDB.lastName,
    preferredName: volunteerDB.preferredName ?? undefined,
    bio: volunteerDB.bio ?? undefined,
    pronouns: volunteerDB.pronouns ?? undefined,
    phoneNumber: volunteerDB.phoneNumber ?? undefined,
    city: volunteerDB.city ?? undefined,
    province: volunteerDB.province ?? undefined,
    availability: volunteerDB.availability ?? undefined,
    preferredTimeCommitmentHours:
      volunteerDB.preferredTimeCommitmentHours ?? undefined,
    email: volunteerDB.email,
    status: volunteerDB.status,
    image: volunteerDB.image ?? undefined,
    createdAt: volunteerDB.createdAt,
    updatedAt: volunteerDB.updatedAt,
    emailVerified: volunteerDB.emailVerified,
  } as const;
}

export function getEmbeddedVolunteer(v: Volunteer) {
  return {
    id: v.id,
    name: v.name,
    lastName: v.lastName,
    email: v.email,
    image: v.image,
  } as const;
}

export function getListVolunteer(v: Volunteer) {
  return {
    id: v.id,
    name: v.name,
    lastName: v.lastName,
    email: v.email,
    status: v.status,
    image: v.image,
  } as const;
}

export type ListVolunteer = ReturnType<typeof getListVolunteer>;
export type EmbeddedVolunteer = ReturnType<typeof getEmbeddedVolunteer>;
