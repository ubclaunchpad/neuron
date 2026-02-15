import type { auth } from "@/lib/auth";
import { appInviteClient } from "@better-auth-extended/app-invite/client";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  plugins: [
    inferAdditionalFields<typeof auth>(),
    appInviteClient({
      schema: {
        appInvitation: {
          additionalFields: {
            role: {
              type: "string",
              required: true,
              input: true,
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
      },
    }),
  ],
});
