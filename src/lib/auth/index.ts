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
import { renderVerifyEmail } from "@/server/emails/templates/verify-email";
import { betterAuth, type BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { appInvitePlugin } from "@/lib/auth/extensions/app-invite/server-plugin";

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
      const { html, text } = await renderForgotPassword({
        url,
        userName: user.name,
      });
      await emailService.send(user.email, "Reset your password", text, html);
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      const scope = createRequestScope();
      const { emailService } = scope.cradle;
      const { html, text } = await renderVerifyEmail({
        url,
        userName: user.name,
      });
      await emailService.send(
        user.email,
        "Verify your email address",
        text,
        html,
      );
    },
  },
  plugins: [nextCookies(), appInvitePlugin],
} satisfies BetterAuthOptions);

export type Session = typeof auth.$Infer.Session;
export type User = Session["user"];
