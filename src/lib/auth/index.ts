import "server-only";

import {
  Role,
  RoleEnum,
  UserStatus,
  UserStatusEnum,
} from "@/models/interfaces";
import { createRequestScope } from "@/server/api/di-container";
import { db } from "@/server/db";
import {
  account,
  appInvitation,
  session,
  verification,
} from "@/server/db/schema/auth";
import { user, volunteer } from "@/server/db/schema/user";
import { renderForgotPassword } from "@/server/emails/templates/forgot-password";
import { renderRequestChangeEmail } from "@/server/emails/templates/request-change-email";
import { renderVerifyEmail } from "@/server/emails/templates/verify-email";
import { renderVerifyNewEmail } from "@/server/emails/templates/verify-new-email";
import { betterAuth, type BetterAuthOptions } from "better-auth";
import {
  APIError,
  createAuthMiddleware,
  getSessionFromCtx,
} from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { appInvitePlugin } from "@/lib/auth/extensions/app-invite/server-plugin";
import { hasPermission } from "@/lib/auth/extensions/permissions";

const NON_ACTIVE_ALLOWED_AUTH_PATHS = new Set([
  "/ok",
  "/error",
  "/get-session",
  "/sign-in/email",
  "/sign-in/social",
  "/sign-up/email",
  "/sign-out",
  "/callback/:id",
  "/send-verification-email",
  "/verify-email",
  "/request-password-reset",
  "/reset-password",
  "/reset-password/:token",
  "/get-app-invitation",
  "/accept-invitation",
  "/reject-invitation",
]);

const INVITATION_MANAGEMENT_AUTH_PATHS = new Set([
  "/invite-user",
  "/cancel-invitation",
  "/list-invitations",
]);

export const auth = betterAuth({
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (!ctx.path || NON_ACTIVE_ALLOWED_AUTH_PATHS.has(ctx.path)) {
        return;
      }

      const activeSession = await getSessionFromCtx(ctx, {
        disableCookieCache: true,
      });
      if (!activeSession?.user) {
        return;
      }

      const currentUser = (await ctx.context.internalAdapter.findUserById(
        activeSession.user.id,
      )) as User | null;

      if (!currentUser || currentUser.status !== UserStatus.active) {
        throw new APIError("FORBIDDEN", {
          code: "ACCOUNT_NOT_ACTIVE",
          message: "Account is not active.",
        });
      }

      if (
        INVITATION_MANAGEMENT_AUTH_PATHS.has(ctx.path) &&
        !hasPermission({
          user: currentUser,
          permission: { users: ["invite"] },
        })
      ) {
        throw new APIError("FORBIDDEN", {
          code: "YOU_ARE_NOT_ALLOWED_TO_INVITE_USERS_TO_THIS_APPLICATION",
          message:
            "You are not allowed to invite users to this application.",
        });
      }
    }),
  },
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
    changeEmail: {
      enabled: true,
      sendChangeEmailConfirmation: async ({
        user,
        newEmail,
        url,
      }: {
        user: { name: string; email: string };
        newEmail: string;
        url: string;
      }) => {
        const scope = createRequestScope();
        const { emailService } = scope.cradle;
        const { html, text } = await renderRequestChangeEmail({
          url,
          userName: user.name,
          newEmail: newEmail,
        });
        await emailService.send(
          user.email,
          `Confirm your email address change to ${newEmail}`,
          text,
          html,
        );
      },
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
    sendResetPassword: async ({
      user,
      url,
    }: {
      user: { name: string; email: string };
      url: string;
    }) => {
      const scope = createRequestScope();
      const { jobService } = scope.cradle;
      const { html, text } = await renderForgotPassword({
        url,
        userName: user.name,
      });
      await jobService.run("jobs.send-email", {
        to: user.email,
        subject: "Reset your password",
        text,
        html,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({
      user,
      url,
    }: {
      user: { name: string; email: string; emailVerified: boolean };
      url: string;
    }) => {
      const scope = createRequestScope();
      const { emailService } = scope.cradle;
      const isEmailChange = user.emailVerified;
      const { html, text } = isEmailChange
        ? await renderVerifyNewEmail({
            url,
            userName: user.name,
          })
        : await renderVerifyEmail({
            url,
            userName: user.name,
          });
      await emailService.send(
        user.email,
        isEmailChange
          ? "Verify your new email address"
          : "Verify your email address",
        text,
        html,
      );
    },
  },
  plugins: [nextCookies(), appInvitePlugin],
} satisfies BetterAuthOptions);

export type Session = typeof auth.$Infer.Session;
export type User = Session["user"];
