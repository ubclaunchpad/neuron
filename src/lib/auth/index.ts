import { Role, RoleEnum, Status, StatusEnum } from "@/models/interfaces";
import { createRequestScope } from "@/server/api/di-container";
import { db } from "@/server/db";
import { account, session, verification } from "@/server/db/schema/auth";
import { user, volunteer } from "@/server/db/schema/user";
import {
  betterAuth,
  type BetterAuthOptions,
  type InferSession,
  type InferUser,
} from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import {
  rolePlugin,
  type SessionWithRole,
  type UserWithRole,
} from "./extensions/role-plugin";

/**
 * We define BaseAuthConfig before using it in the type annotation to avoid circular dependencies.
 * TypeScript needs to know the shape of baseAuthConfig before we can use `typeof baseAuthConfig`
 * in the type definition, so we must declare the config object first, then reference its type.
 */
export type BaseAuthConfig = typeof baseAuthConfig;
const baseAuthConfig = {
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
} as const satisfies BetterAuthOptions;

export type BaseUser = InferUser<BaseAuthConfig>;
export type BaseSession = {
  session: InferSession<BaseAuthConfig>;
  user: InferUser<BaseAuthConfig>;
};

export const auth = betterAuth({
  user: baseAuthConfig.user,
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
          switch ((user as BaseUser).role as any) {
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
    // Need to add rolePlugin after to avoid circular dependency on the user type
    rolePlugin,
  ],
});

export type Session = SessionWithRole;
export type User = UserWithRole;
