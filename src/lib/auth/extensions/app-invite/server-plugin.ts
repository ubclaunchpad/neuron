import { RoleEnum, UserStatus } from "@/models/interfaces";
import { createRequestScope } from "@/server/api/di-container";
import { db as defaultDb, type Drizzle } from "@/server/db";
import { renderInvitation } from "@/server/emails/templates/invitation";
import { reconcileInvitedUser } from "@/server/services/entity/accountProvisioning";
import { normalizeEmail } from "@/utils/emailUtils";
import { appInvite } from "@better-auth-extended/app-invite";
import { APIError } from "better-auth/api";
import { env } from "@/env";
import { hasPermission } from "@/lib/auth/extensions/permissions";
import { appInviteSchema } from "./shared";
import type { User } from "../..";

function canManageInvitations(ctx: {
  context: { session?: { user?: unknown } | null };
}): boolean {
  const currentUser = ctx.context.session?.user as User | undefined;
  return (
    currentUser?.status === UserStatus.active &&
    hasPermission({ user: currentUser, permission: { users: ["invite"] } })
  );
}

type SendInvitationEmailFn = NonNullable<
  Parameters<typeof appInvite>[0]
>["sendInvitationEmail"];

const defaultSendInvitationEmail: SendInvitationEmailFn = async (
  invitation,
  request,
) => {
  if (!invitation.email) {
    return;
  }

  const scope = createRequestScope();
  const { jobService } = scope.cradle;

  const origin = request ? new URL(request.url).origin : env.NEURON_BASE_URL;
  const inviteUrl = new URL(
    `/auth/signup?invitationId=${invitation.id}`,
    origin,
  ).toString();

  const { html, text } = await renderInvitation({
    inviteUrl,
    inviterName: invitation.inviter.name,
    inviterEmail: invitation.inviter.email,
  });
  await jobService.run("jobs.send-email", {
    to: normalizeEmail(invitation.email),
    subject: "You've been invited to Neuron",
    text,
    html,
  });
};

export function createAppInvitePlugin(options?: {
  db?: Drizzle;
  sendInvitationEmail?: SendInvitationEmailFn;
}) {
  const pluginDb = options?.db ?? defaultDb;

  return appInvite({
    sendInvitationEmail:
      options?.sendInvitationEmail ?? defaultSendInvitationEmail,
    canCreateInvitation: canManageInvitations,
    canCancelInvitation: canManageInvitations,
    verifyEmailOnAccept: true,
    schema: appInviteSchema,
    hooks: {
      create: {
        before: async (ctx) => {
          const body = ctx.body as {
            email?: string;
            additionalFields?: { role?: unknown };
          };
          if (typeof body.email === "string") {
            body.email = normalizeEmail(body.email);
          }

          const roleResult = RoleEnum.safeParse(body.additionalFields?.role);
          if (!roleResult.success) {
            throw new APIError("BAD_REQUEST", {
              message: "Invitation role is missing or invalid.",
            });
          }
        },
      },
      accept: {
        before: async (_, userData) => {
          if (typeof userData.email === "string") {
            userData.email = normalizeEmail(userData.email);
          }
        },
        after: async (_, data) => {
          const invitation = data.invitation as { role?: unknown };
          await reconcileInvitedUser(pluginDb, {
            userId: data.user.id,
            role: invitation.role,
            email: data.user.email,
          });
        },
      },
    },
  });
}

export const appInvitePlugin = createAppInvitePlugin();
