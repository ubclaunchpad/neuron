import type { UserDB } from "@/server/db/schema";
import type { Role, UserStatus } from "./interfaces";

export type User = {
  id: string;
  name: string;
  lastName: string;
  email: string;
  status: UserStatus;
  role: Role;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
};

export function buildUser(userDB: UserDB): User {
  return {
    id: userDB.id,
    name: userDB.name,
    lastName: userDB.lastName,
    email: userDB.email,
    status: userDB.status,
    role: userDB.role,
    image: userDB.image ?? undefined,
    createdAt: userDB.createdAt,
    updatedAt: userDB.updatedAt,
  } as const;
}

export function getListUser(u: User) {
  return {
    id: u.id,
    name: u.name,
    lastName: u.lastName,
    email: u.email,
    status: u.status,
    role: u.role,
    image: u.image,
  } as const;
}

export function getEmbeddedUser(u: User) {
  return {
    id: u.id,
    name: u.name,
    lastName: u.lastName,
    email: u.email,
    status: u.status,
    image: u.image,
  } as const;
}

export type ListUser = ReturnType<typeof getListUser>;
export type EmbeddedUser = ReturnType<typeof getEmbeddedUser>;
