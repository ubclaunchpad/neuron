import { appInviteClient } from "@better-auth-extended/app-invite/client";
import { appInviteSchema } from "./shared";

export const appInviteClientPlugin = appInviteClient({
  schema: appInviteSchema,
});
