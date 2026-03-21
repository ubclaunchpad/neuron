import { RoleEnum } from "@/models/interfaces";

export const appInviteSchema = {
  appInvitation: {
    additionalFields: {
      role: {
        type: RoleEnum.options,
        input: true,
        required: true,
      },
    },
  },
  user: {
    additionalFields: {
      lastName: {
        type: "string",
        required: true,
        input: true,
      },
    },
  },
} as const;
