import "server-only";

import { Role, RoleEnum, UserStatus } from "@/models/interfaces";
import { createRequestScope } from "@/server/api/di-container";
import { db } from "@/server/db";
import { user, volunteer } from "@/server/db/schema/user";
import { renderInvitation } from "@/server/emails/templates/invitation";
import { appInvite } from "@better-auth-extended/app-invite";
import { env } from "@/env";
import { eq } from "drizzle-orm";
import { hasPermission } from "@/lib/auth/extensions/permissions";
import { appInviteSchema } from "./shared";
import type { User } from "../..";

export const appInvitePlugin = appInvite({
  sendInvitationEmail: async (invitation, request) => {
    if (!invitation.email) {
      return;
    }

    const scope = createRequestScope();
    const { emailService } = scope.cradle;

    const origin = request ? new URL(request.url).origin : env.BASE_URL;
    const inviteUrl = new URL(
      `/auth/signup?invitationId=${invitation.id}`,
      origin,
    ).toString();

    const { html, text } = await renderInvitation({
      inviteUrl,
      inviterName: invitation.inviter.name,
      inviterEmail: invitation.inviter.email,
    });
    await emailService.send(
      invitation.email,
      "You've been invited to Neuron",
      text,
      html,
    );
  },
  canCreateInvitation: (ctx): boolean => {
    const inviter = ctx.context.session?.user as User;
    if (!inviter) {
      return false;
    }

    return hasPermission({
      user: inviter,
      permission: { users: ["invite"] },
    });
  },
  verifyEmailOnAccept: true,
  schema: appInviteSchema,
  hooks: {
    accept: {
      after: async (_, data) => {
        const invitation = data.invitation as AppInvitation;
        const roleResult = RoleEnum.safeParse(invitation.role);
        if (!roleResult.success) {
          throw new Error("Invitation role is missing or invalid.");
        }

        await db
          .update(user)
          .set({
            role: roleResult.data,
            status: UserStatus.active,
          })
          .where(eq(user.id, data.user.id));

        if (roleResult.data !== Role.volunteer) {
          await db.delete(volunteer).where(eq(volunteer.userId, data.user.id));
        }
      },
    },
  },
});

type AppInvitation = typeof appInvitePlugin.$Infer.AppInvitation;
