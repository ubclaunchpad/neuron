import { Role, RoleEnum, UserStatus } from "@/models/interfaces";
import { createRequestScope } from "@/server/api/di-container";
import { db } from "@/server/db";
import { user, volunteer } from "@/server/db/schema/user";
import {
  appInvite,
  type AppInviteOptions,
} from "@better-auth-extended/app-invite";
import { env } from "@/env";
import { eq } from "drizzle-orm";
import { hasPermission } from "@/lib/auth/extensions/permissions";
import { appInviteClient } from "@better-auth-extended/app-invite/client";
import type { User } from "..";

const schema = {
  appInvitation: {
    additionalFields: {
      role: {
        type: RoleEnum.options,
        input: false,
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
} satisfies AppInviteOptions["schema"];

export const appInvitePlugin = appInvite({
  sendInvitationEmail: async (invitation, request) => {
    if (!invitation.email) {
      return;
    }

    const scope = createRequestScope();
    const { emailService } = scope.cradle;

    const origin = request ? new URL(request.url).origin : env.BETTER_AUTH_URL;
    const inviteUrl = new URL(
      `/auth/signup?invitationId=${invitation.id}`,
      origin,
    ).toString();

    await emailService.send(
      invitation.email,
      "You've been invited to Neuron",
      `You were invited by ${invitation.inviter.name} (${invitation.inviter.email}). Complete your sign up here: ${inviteUrl}`,
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
  schema,
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

export const appInviteClientPlugin = appInviteClient({
  schema,
});

type AppInvitation = typeof appInvitePlugin.$Infer.AppInvitation;
