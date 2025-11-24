import { z } from "zod";
import { RoleEnum, StatusEnum } from "../interfaces";
import { ListRequestWithSearch } from "./common";

export const UserIdInput = z.object({
  userId: z.uuid(),
});

export const ListUsersInput = ListRequestWithSearch.extend({
  rolesToInclude: z.array(RoleEnum).optional(),
  statusesToInclude: z.array(StatusEnum).optional(),
});
export type ListUsersInput = z.infer<typeof ListUsersInput>;

export const CreateUserInput = z.object({
  role: RoleEnum,
  name: z.string().nonempty("Please fill out this field."),
  lastName: z.string().nonempty("Please fill out this field."),
  email: z.email("Please enter a valid email address."),
});
export type CreateUserInput = z.infer<typeof CreateUserInput>;