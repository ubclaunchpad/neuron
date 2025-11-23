import { customSession } from "better-auth/plugins";
import { eq } from "drizzle-orm";

import { Role } from "@/models/interfaces";
import { buildVolunteer } from "@/models/volunteer";
import { db } from "@/server/db";
import { volunteerUserView } from "@/server/db/schema";
import type { BaseAuthConfig, BaseSession, BaseUser } from "..";
import { TRPCError } from "@trpc/server";

type VolunteerUser = BaseUser & {
  role: typeof Role.volunteer;
  preferredName?: string;
  bio?: string;
  pronouns?: string;
  phoneNumber?: string;
  city?: string;
  province?: string;
  availability?: string;
  preferredTimeCommitmentHours?: number;
};
type InstructorUser = BaseUser & { role: typeof Role.instructor };
type AdminUser = BaseUser & { role: typeof Role.admin };

export type UserWithRole = VolunteerUser | InstructorUser | AdminUser;
export type SessionWithRole = BaseSession & { user: UserWithRole };

export const rolePlugin = customSession<SessionWithRole, BaseAuthConfig>(
  async ({ user: baseUser, session }: BaseSession) => {
    switch (baseUser.role) {
      case Role.volunteer:
        const [volunteerFields] = await db
          .select()
          .from(volunteerUserView)
          .where(eq(volunteerUserView.id, baseUser.id));

        return {
          user: {
            ...baseUser,
            ...buildVolunteer(volunteerFields!),
            role: Role.volunteer,
          } satisfies VolunteerUser,
          session,
        };
      case Role.instructor:
        return {
          user: {
            ...baseUser,
            role: Role.instructor,
          } satisfies InstructorUser,
          session,
        };
      case Role.admin:
        return {
          user: {
            ...baseUser,
            role: Role.admin,
          } satisfies AdminUser,
          session,
        };
    }

    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Unknown role: ${String(baseUser.role)}`,
    });
  },
);
