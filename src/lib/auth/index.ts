import {
  Role,
  RoleEnum,
  UserStatus,
  UserStatusEnum,
} from "@/models/interfaces";
import { createRequestScope } from "@/server/api/di-container";
import { db } from "@/server/db";
import { account, appInvitation, session, verification } from "@/server/db/schema/auth";
import { user, volunteer } from "@/server/db/schema/user";
import { betterAuth, type BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { appInvite } from "@better-auth-extended/app-invite";
import { eq } from "drizzle-orm";

export const auth = betterAuth({
  user: {
    additionalFields: {
      role: {
        type: RoleEnum.options,
        defaultValue: Role.volunteer,
        input: false,
      },
      status: {
        type: UserStatusEnum.options,
        defaultValue: UserStatus.unverified,
        input: false,
      },
      lastName: { type: "string" },
    },
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user,
      session,
      account,
      verification,
      appInvitation,
    },
  }),
  advanced: {
    database: {
      generateId: false,
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          switch (user.role) {
            case Role.volunteer:
              await db.insert(volunteer).values({ userId: user.id });
              return;
            case Role.instructor:
            case Role.admin:
              return;
          }

          throw new Error(`Unknown role: ${user.role}`);
        },
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      const scope = createRequestScope();
      const { emailService } = scope.cradle;
      await emailService.send(
        user.email,
        "Reset your password",
        `Click the link to reset your password: ${url}`,
      );
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      const scope = createRequestScope();
      const { emailService } = scope.cradle;
      await emailService.send(
        user.email,
        "Verify your email address",
        `Click the link to verify your email: ${url}`,
      );
    },
  },
  plugins: [
    nextCookies(),
    appInvite({
      sendInvitationEmail: async (invitation, request) => {
        if (!invitation.email) {
          return;
        }

        const scope = createRequestScope();
        const { emailService } = scope.cradle;
        const origin =
          request ? new URL(request.url).origin : (process.env.BETTER_AUTH_URL ?? "http://localhost:3000");
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
        const inviter = ctx.context.session?.user;
        if (!inviter) {
          return false;
        }

        return inviter.role === Role.admin || inviter.role === Role.instructor;
      },
      verifyEmailOnAccept: true,
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
      hooks: {
        accept: {
          after: async (_ctx, data) => {
            const roleResult = RoleEnum.safeParse(
              (data.invitation as { role?: unknown }).role,
            );
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
          },
        },
      },
    }),
  ],
} satisfies BetterAuthOptions);

export type Session = typeof auth.$Infer.Session;
export type User = Session["user"];
