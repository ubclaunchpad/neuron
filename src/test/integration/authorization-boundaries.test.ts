import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { randomUUID } from "crypto";
import { eq, inArray } from "drizzle-orm";
import { AVAILABILITY_SLOTS } from "@/constants";
import { Role, UserStatus } from "@/models/interfaces";
import {
  appInvitation,
  course,
  coursePreference,
  session,
  term,
  user,
  volunteer,
} from "@/server/db/schema";
import type { IUserService } from "@/server/services/entity/userService";
import {
  createTestScope,
  type ITestServiceScope,
} from "../helpers/test-service-scope";

const { jobRunMock, emailSendMock } = vi.hoisted(() => ({
  jobRunMock: vi.fn(async () => "mock-job-id"),
  emailSendMock: vi.fn(async () => undefined),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/server/api/di-container", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/server/api/di-container")>();
  return {
    ...actual,
    createRequestScope: () => ({
      cradle: {
        jobService: { run: jobRunMock },
        emailService: { send: emailSendMock },
      },
    }),
  };
});

import { auth } from "@/lib/auth";
import { appRouter } from "@/server/api/root";
import type { TRPCContext } from "@/server/api/trpc-context";

function extractCookieHeader(response: Response): string {
  const headersObj = response.headers as Headers & {
    getSetCookie?: () => string[];
  };
  const setCookies =
    typeof headersObj.getSetCookie === "function"
      ? headersObj.getSetCookie()
      : [response.headers.get("set-cookie")].filter((v): v is string => !!v);

  return setCookies.map((cookie) => cookie.split(";")[0]!).join("; ");
}

async function callAuth(
  path: string,
  options: {
    method?: string;
    cookie?: string;
    body?: unknown;
  } = {},
): Promise<Response> {
  const headers = new Headers();
  if (options.cookie) {
    headers.set("cookie", options.cookie);
  }
  if (options.body !== undefined) {
    headers.set("content-type", "application/json");
  }

  return auth.handler(
    new Request(`http://localhost:3000/api/auth${path}`, {
      method: options.method ?? (options.body !== undefined ? "POST" : "GET"),
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    }),
  );
}

describe("Authorization boundaries, active status enforcement, and session revocation", () => {
  let scope: ITestServiceScope;
  let userService: IUserService;

  let createdUserIds: string[] = [];
  let createdTermIds: string[] = [];
  let createdCourseIds: string[] = [];

  beforeEach(() => {
    scope = createTestScope();
    userService = scope.resolve<IUserService>("userService");
    jobRunMock.mockClear();
    emailSendMock.mockClear();
  });

  afterEach(async () => {
    if (createdCourseIds.length > 0) {
      await scope.db.delete(course).where(inArray(course.id, createdCourseIds));
      createdCourseIds = [];
    }
    if (createdTermIds.length > 0) {
      await scope.db.delete(term).where(inArray(term.id, createdTermIds));
      createdTermIds = [];
    }
    if (createdUserIds.length > 0) {
      await scope.db.delete(user).where(inArray(user.id, createdUserIds));
      createdUserIds = [];
    }
    scope.dispose();
  });

  function createCaller() {
    return appRouter.createCaller(scope.container.cradle as TRPCContext);
  }

  async function seedVolunteer(overrides: {
    name: string;
    lastName: string;
    phoneNumber: string;
    bio: string;
    city: string;
    province: string;
    preferredName: string;
    availability: string;
    preferredTimeCommitmentHours: number;
    status?: UserStatus;
  }): Promise<string> {
    const id = randomUUID();
    await scope.db.insert(user).values({
      id,
      name: overrides.name,
      lastName: overrides.lastName,
      email: `vol-${id}@test.com`,
      role: Role.volunteer,
      status: overrides.status ?? UserStatus.active,
      emailVerified: true,
    });
    createdUserIds.push(id);

    await scope.db.insert(volunteer).values({
      userId: id,
      preferredName: overrides.preferredName,
      bio: overrides.bio,
      phoneNumber: overrides.phoneNumber,
      city: overrides.city,
      province: overrides.province,
      availability: overrides.availability,
      preferredTimeCommitmentHours: overrides.preferredTimeCommitmentHours,
    });

    return id;
  }

  async function seedCourse(): Promise<string> {
    const termId = randomUUID();
    const courseId = randomUUID();

    await scope.db.insert(term).values({
      id: termId,
      name: `Auth Test Term ${termId}`,
      startDate: "2026-06-01",
      endDate: "2026-08-31",
      published: true,
    });
    createdTermIds.push(termId);

    await scope.db.insert(course).values({
      id: courseId,
      termId,
      name: `Auth Test Course ${courseId}`,
      lowerLevel: 1,
      upperLevel: 2,
      category: "literacy",
    });
    createdCourseIds.push(courseId);

    return courseId;
  }

  async function createAuthUserAndSignIn(opts: {
    role: Role;
    status: UserStatus;
    name?: string;
    lastName?: string;
  }): Promise<{ userId: string; email: string; password: string; cookie: string }> {
    const email = `auth-${opts.role}-${opts.status}-${randomUUID()}@test.com`;
    const password = "StrongPassword123!";
    const signUpRes = await callAuth("/sign-up/email", {
      body: {
        name: opts.name ?? "Test",
        lastName: opts.lastName ?? "Account",
        email,
        password,
      },
    });
    expect(signUpRes.status).toBe(200);

    const [created] = await scope.db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, email));
    expect(created).toBeDefined();
    createdUserIds.push(created!.id);

    await scope.db
      .update(user)
      .set({
        role: opts.role,
        status: opts.status,
        emailVerified: true,
      })
      .where(eq(user.id, created!.id));

    if (opts.role !== Role.volunteer) {
      await scope.db.delete(volunteer).where(eq(volunteer.userId, created!.id));
    }

    const signInRes = await callAuth("/sign-in/email", {
      body: { email, password },
    });
    expect(signInRes.status).toBe(200);
    const cookie = extractCookieHeader(signInRes);
    expect(cookie).toContain("better-auth.session_token=");

    return { userId: created!.id, email, password, cookie };
  }

  describe("volunteer router object-level authorization", () => {
    const allZeros = "0".repeat(AVAILABILITY_SLOTS);
    const firstSlotOn = `1${"0".repeat(AVAILABILITY_SLOTS - 1)}`;
    const secondSlotOn = `01${"0".repeat(AVAILABILITY_SLOTS - 2)}`;

    it("prevents a volunteer from reading another volunteer via byId while allowing self-service me and explicit admin byId", async () => {
      const volunteerAId = await seedVolunteer({
        name: "Alice",
        lastName: "Volunteer",
        preferredName: "Ali",
        bio: "Alice bio",
        phoneNumber: "6045550101",
        city: "Vancouver",
        province: "BC",
        availability: firstSlotOn,
        preferredTimeCommitmentHours: 4,
      });
      const volunteerBId = await seedVolunteer({
        name: "Bob",
        lastName: "Volunteer",
        preferredName: "Bobby",
        bio: "Bob private bio",
        phoneNumber: "6045550199",
        city: "Victoria",
        province: "BC",
        availability: secondSlotOn,
        preferredTimeCommitmentHours: 8,
      });

      scope.mockSession.setAsVolunteer({ id: volunteerAId });
      const caller = createCaller();

      const ownProfile = await caller.volunteer.me();
      expect(ownProfile.id).toBe(volunteerAId);
      expect(ownProfile.bio).toBe("Alice bio");
      expect(ownProfile.phoneNumber).toBe("6045550101");

      await expect(
        caller.volunteer.byId({ userId: volunteerBId }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });

      await expect(
        caller.volunteer.byId({ userId: volunteerAId }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });

      scope.mockSession.setAsInstructor();
      await expect(
        caller.volunteer.byId({ userId: volunteerBId }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });

      scope.mockSession.setAsAdmin();
      const adminView = await caller.volunteer.byId({ userId: volunteerBId });
      expect(adminView.id).toBe(volunteerBId);
      expect(adminView.bio).toBe("Bob private bio");
      expect(adminView.phoneNumber).toBe("6045550199");
    });

    it("always binds profile, availability, and class preference mutations/reads to the session user and never touches another volunteer", async () => {
      const volunteerAId = await seedVolunteer({
        name: "Alice",
        lastName: "One",
        preferredName: "Alice",
        bio: "Original Alice bio",
        phoneNumber: "6045550111",
        city: "Vancouver",
        province: "BC",
        availability: allZeros,
        preferredTimeCommitmentHours: 2,
      });
      const volunteerBId = await seedVolunteer({
        name: "Bob",
        lastName: "Two",
        preferredName: "Bob",
        bio: "Original Bob bio",
        phoneNumber: "6045550222",
        city: "Burnaby",
        province: "BC",
        availability: secondSlotOn,
        preferredTimeCommitmentHours: 6,
      });
      const courseId = await seedCourse();

      // Seed Bob's class preference as true
      await scope.db.insert(coursePreference).values({
        volunteerUserId: volunteerBId,
        courseId,
      });

      scope.mockSession.setAsVolunteer({ id: volunteerAId });
      const caller = createCaller();

      // Attempt to smuggle Bob's ID into profile update
      await caller.volunteer.updateVolunteerProfile({
        volunteerUserId: volunteerBId,
        bio: "Updated by Alice",
        city: "Surrey",
      } as never);

      // Attempt to smuggle Bob's ID into availability update
      await caller.volunteer.updateVolunteerAvailability({
        volunteerUserId: volunteerBId,
        availability: firstSlotOn,
        preferredTimeCommitmentHours: 10,
      } as never);

      // Attempt to read Bob's class preference by smuggling userId
      const alicePrefBefore = await caller.volunteer.getClassPreference({
        userId: volunteerBId,
        classId: courseId,
      } as never);
      expect(alicePrefBefore).toEqual({ preferred: false });

      // Attempt to clear Bob's class preference by smuggling userId
      await caller.volunteer.setClassPreference({
        userId: volunteerBId,
        classId: courseId,
        preferred: false,
      } as never);

      // Set Alice's own preference to true
      await caller.volunteer.setClassPreference({
        classId: courseId,
        preferred: true,
      });
      expect(await caller.volunteer.getClassPreference({ classId: courseId })).toEqual({
        preferred: true,
      });

      // Verify Alice was updated
      const [aliceRow] = await scope.db
        .select()
        .from(volunteer)
        .where(eq(volunteer.userId, volunteerAId));
      expect(aliceRow?.bio).toBe("Updated by Alice");
      expect(aliceRow?.city).toBe("Surrey");
      expect(aliceRow?.availability).toBe(firstSlotOn);
      expect(aliceRow?.preferredTimeCommitmentHours).toBe(10);

      // Verify Bob was completely untouched
      const [bobRow] = await scope.db
        .select()
        .from(volunteer)
        .where(eq(volunteer.userId, volunteerBId));
      expect(bobRow?.bio).toBe("Original Bob bio");
      expect(bobRow?.city).toBe("Burnaby");
      expect(bobRow?.availability).toBe(secondSlotOn);
      expect(bobRow?.preferredTimeCommitmentHours).toBe(6);

      const bobPrefs = await scope.db
        .select()
        .from(coursePreference)
        .where(eq(coursePreference.volunteerUserId, volunteerBId));
      expect(bobPrefs).toHaveLength(1);
      expect(bobPrefs[0]?.courseId).toBe(courseId);
    });

    it("blocks non-active users across all non-active statuses on tRPC procedures", async () => {
      const targetVolunteerId = await seedVolunteer({
        name: "Target",
        lastName: "Vol",
        preferredName: "Target",
        bio: "bio",
        phoneNumber: "6045550333",
        city: "Vancouver",
        province: "BC",
        availability: allZeros,
        preferredTimeCommitmentHours: 1,
      });

      const caller = createCaller();

      for (const nonActiveStatus of [
        UserStatus.unverified,
        UserStatus.inactive,
        UserStatus.rejected,
      ]) {
        scope.mockSession.setAsVolunteer({
          id: targetVolunteerId,
          status: nonActiveStatus,
        });
        await expect(caller.volunteer.me()).rejects.toMatchObject({
          code: "UNAUTHORIZED",
        });

        scope.mockSession.setAsAdmin({ status: nonActiveStatus });
        await expect(
          caller.volunteer.byId({ userId: targetVolunteerId }),
        ).rejects.toMatchObject({
          code: "UNAUTHORIZED",
        });
      }
    });
  });

  describe("deactivation session revocation", () => {
    it("atomically sets status to inactive and revokes all active sessions for the deactivated user only", async () => {
      const targetUserId = randomUUID();
      const otherUserId = randomUUID();

      await scope.db.insert(user).values([
        {
          id: targetUserId,
          name: "Target",
          lastName: "Admin",
          email: `target-${targetUserId}@test.com`,
          role: Role.admin,
          status: UserStatus.active,
          emailVerified: true,
        },
        {
          id: otherUserId,
          name: "Other",
          lastName: "Admin",
          email: `other-${otherUserId}@test.com`,
          role: Role.admin,
          status: UserStatus.active,
          emailVerified: true,
        },
      ]);
      createdUserIds.push(targetUserId, otherUserId);

      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await scope.db.insert(session).values([
        {
          userId: targetUserId,
          token: `tok-1-${randomUUID()}`,
          expiresAt,
        },
        {
          userId: targetUserId,
          token: `tok-2-${randomUUID()}`,
          expiresAt,
        },
        {
          userId: otherUserId,
          token: `tok-3-${randomUUID()}`,
          expiresAt,
        },
      ]);

      await userService.deactivateUser(targetUserId);

      const [updatedTarget] = await scope.db
        .select({ status: user.status })
        .from(user)
        .where(eq(user.id, targetUserId));
      expect(updatedTarget?.status).toBe(UserStatus.inactive);

      const targetSessions = await scope.db
        .select()
        .from(session)
        .where(eq(session.userId, targetUserId));
      expect(targetSessions).toHaveLength(0);

      const otherSessions = await scope.db
        .select()
        .from(session)
        .where(eq(session.userId, otherUserId));
      expect(otherSessions).toHaveLength(1);
    });
  });

  describe("privileged Better-Auth endpoints enforce current account status", () => {
    it("revokes an admin session on deactivation and blocks deactivated/non-active admins from inviting, listing, canceling, or mutating accounts", async () => {
      const activeAdmin = await createAuthUserAndSignIn({
        role: Role.admin,
        status: UserStatus.active,
        name: "Primary",
        lastName: "Admin",
      });
      const secondActiveAdmin = await createAuthUserAndSignIn({
        role: Role.admin,
        status: UserStatus.active,
        name: "Secondary",
        lastName: "Admin",
      });

      // 1. Active admin can invite and list invitations
      const initialInviteEmail = `invited-legit-${randomUUID()}@test.com`;
      const createRes = await callAuth("/invite-user", {
        cookie: activeAdmin.cookie,
        body: {
          type: "personal",
          email: initialInviteEmail,
          additionalFields: { role: Role.instructor },
        },
      });
      expect(createRes.status).toBe(200);
      const createdInvite = (await createRes.json()) as { id: string };
      expect(createdInvite.id).toBeTruthy();

      const listRes = await callAuth("/list-invitations", {
        cookie: activeAdmin.cookie,
      });
      expect(listRes.status).toBe(200);

      // 2. Deactivate the admin -> existing session is immediately revoked
      await userService.deactivateUser(activeAdmin.userId);

      const revokedSessionRes = await callAuth("/get-session", {
        cookie: activeAdmin.cookie,
      });
      expect(revokedSessionRes.status).toBe(200);
      expect(await revokedSessionRes.json()).toBeNull();

      const replacementInviteEmail = `replacement-admin-${randomUUID()}@test.com`;
      const revokedInviteRes = await callAuth("/invite-user", {
        cookie: activeAdmin.cookie,
        body: {
          type: "personal",
          email: replacementInviteEmail,
          additionalFields: { role: Role.admin },
        },
      });
      expect(revokedInviteRes.status).toBe(401);

      // 3. Even if the inactive admin signs back in (e.g. to view /inactive),
      // privileged auth endpoints reject with 403 while get-session and sign-out still work
      const reloginRes = await callAuth("/sign-in/email", {
        body: { email: activeAdmin.email, password: activeAdmin.password },
      });
      expect(reloginRes.status).toBe(200);
      const inactiveAdminCookie = extractCookieHeader(reloginRes);

      const inactiveSessionRes = await callAuth("/get-session", {
        cookie: inactiveAdminCookie,
      });
      expect(inactiveSessionRes.status).toBe(200);
      const inactiveSessionBody = (await inactiveSessionRes.json()) as {
        user: { status: string };
      };
      expect(inactiveSessionBody.user.status).toBe(UserStatus.inactive);

      const inactiveInviteRes = await callAuth("/invite-user", {
        cookie: inactiveAdminCookie,
        body: {
          type: "personal",
          email: replacementInviteEmail,
          additionalFields: { role: Role.admin },
        },
      });
      expect(inactiveInviteRes.status).toBe(403);

      const inactiveCancelRes = await callAuth("/cancel-invitation", {
        cookie: inactiveAdminCookie,
        body: { invitationId: createdInvite.id },
      });
      expect(inactiveCancelRes.status).toBe(403);

      const inactiveListRes = await callAuth("/list-invitations", {
        cookie: inactiveAdminCookie,
      });
      expect(inactiveListRes.status).toBe(403);

      const inactiveUpdateRes = await callAuth("/update-user", {
        cookie: inactiveAdminCookie,
        body: { name: "Tampered" },
      });
      expect(inactiveUpdateRes.status).toBe(403);

      // Verify no replacement invitation was created and original invitation is still pending
      const replacementInvites = await scope.db
        .select()
        .from(appInvitation)
        .where(eq(appInvitation.email, replacementInviteEmail));
      expect(replacementInvites).toHaveLength(0);

      const [originalInviteRow] = await scope.db
        .select({ status: appInvitation.status })
        .from(appInvitation)
        .where(eq(appInvitation.id, createdInvite.id));
      expect(originalInviteRow?.status).toBe("pending");

      // Inactive user can still sign out
      const signOutRes = await callAuth("/sign-out", {
        method: "POST",
        cookie: inactiveAdminCookie,
        body: {},
      });
      expect(signOutRes.status).toBe(200);

      // Active admin can cancel the pending invitation
      const cancelByActiveAdmin = await callAuth("/cancel-invitation", {
        cookie: secondActiveAdmin.cookie,
        body: { invitationId: createdInvite.id },
      });
      expect(cancelByActiveAdmin.status).toBe(200);
    });

    it("enforces status and role checks for unverified, rejected, and active non-admin accounts", async () => {
      const unverifiedAdmin = await createAuthUserAndSignIn({
        role: Role.admin,
        status: UserStatus.unverified,
      });
      const rejectedAdmin = await createAuthUserAndSignIn({
        role: Role.admin,
        status: UserStatus.rejected,
      });
      const activeVolunteer = await createAuthUserAndSignIn({
        role: Role.volunteer,
        status: UserStatus.active,
      });

      for (const account of [unverifiedAdmin, rejectedAdmin]) {
        expect(
          (
            await callAuth("/invite-user", {
              cookie: account.cookie,
              body: {
                type: "personal",
                email: `blocked-${randomUUID()}@test.com`,
                additionalFields: { role: Role.admin },
              },
            })
          ).status,
        ).toBe(403);

        expect(
          (await callAuth("/list-invitations", { cookie: account.cookie }))
            .status,
        ).toBe(403);

        expect(
          (
            await callAuth("/update-user", {
              cookie: account.cookie,
              body: { name: "ShouldFail" },
            })
          ).status,
        ).toBe(403);

        expect(
          (await callAuth("/get-session", { cookie: account.cookie })).status,
        ).toBe(200);
      }

      // Active volunteer cannot use invitation endpoints, but CAN update their own profile
      expect(
        (
          await callAuth("/invite-user", {
            cookie: activeVolunteer.cookie,
            body: {
              type: "personal",
              email: `vol-blocked-${randomUUID()}@test.com`,
              additionalFields: { role: Role.admin },
            },
          })
        ).status,
      ).toBe(403);

      expect(
        (
          await callAuth("/list-invitations", {
            cookie: activeVolunteer.cookie,
          })
        ).status,
      ).toBe(403);

      expect(
        (
          await callAuth("/update-user", {
            cookie: activeVolunteer.cookie,
            body: { name: "UpdatedVol" },
          })
        ).status,
      ).toBe(200);
    });
  });
});
