import { z } from "zod";
import { NormalizedEmail } from "../extensions/Email";
import { Role, RoleEnum, UserStatusEnum } from "../interfaces";
import { ListRequestWithSearch } from "./common";

export const DirectProvisionRoleEnum = z.enum([
  Role.admin,
  Role.instructor,
] as const);
export type DirectProvisionRole = z.infer<typeof DirectProvisionRoleEnum>;

export const UserIdInput = z.object({
  userId: z.uuid(),
});

export const ListUsersInput = ListRequestWithSearch.extend({
  rolesToInclude: z.array(RoleEnum).optional(),
  statusesToInclude: z.array(UserStatusEnum).optional(),
});
export type ListUsersInput = z.infer<typeof ListUsersInput>;

export const CreateUserInput = z.object({
  role: DirectProvisionRoleEnum,
  name: z.string().nonempty("Please fill out this field."),
  lastName: z.string().nonempty("Please fill out this field."),
  email: NormalizedEmail,
});
export type CreateUserInput = z.infer<typeof CreateUserInput>;
