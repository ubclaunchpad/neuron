import { Role, RoleEnum, Status, StatusEnum } from "@/models/interfaces";
import { createRequestScope } from "@/server/api/di-container";
import { db } from "@/server/db";
import { account, session, verification } from "@/server/db/schema/auth";
import { user, volunteer } from "@/server/db/schema/user";
import { betterAuth, type BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
  user: {
    additionalFields: {
      role: {
        type: RoleEnum.options,
        defaultValue: Role.volunteer,
        input: false,
      },
      status: {
        type: StatusEnum.options,
        defaultValue: Status.unverified,
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
  ],
} satisfies BetterAuthOptions);

export type Session = typeof auth.$Infer.Session;
export type User = Session["user"];
