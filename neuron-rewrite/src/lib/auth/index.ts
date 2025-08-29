import { adminPluginConfig } from '@/lib/auth/permissions';
import { Role, RoleEnum, Status, StatusEnum } from '@/models/interfaces';
import { db } from '@/server/db';
import { account, session, verification } from '@/server/db/schema/auth';
import { user } from '@/server/db/schema/user';
import { emailService } from '@/server/services/emailService';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';
import { admin } from 'better-auth/plugins/admin';

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: 'pg',
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
        }
    },
    user: {
        additionalFields: {
            role: { type: RoleEnum.options, defaultValue: Role.volunteer, input: false },
            status: { type: StatusEnum.options, defaultValue: Status.pending, input: false },
            lastName: { type: "string" },
            imageId: { type: "string", input: false },
        },
    },
    emailAndPassword: { 
        enabled: true, 
        requireEmailVerification: true,
        sendResetPassword: async ({user, url}) => {
            await emailService.send(
                user.email,
                "Reset your password",
                `Click the link to reset your password: ${url}`
            );
        },
    },
    emailVerification: {
        sendOnSignUp: true,
        sendVerificationEmail: async ({ user, url }) => {
            await emailService.send(
                user.email,
                "Verify your email address",
                `Click the link to verify your email: ${url}`
            );
        }
    },
    plugins: [
        nextCookies(),
        admin(adminPluginConfig),
    ],
});

export type Session = typeof auth.$Infer.Session;
export type User = Session["user"];