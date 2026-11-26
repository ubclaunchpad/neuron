import { beforeEach, describe, expect, it, vi } from "vitest";
import { Role, UserStatus } from "@/models/interfaces";
import type { Session, User } from "@/lib/auth";

const { redirectMock, getSessionMock, headersMock } = vi.hoisted(() => ({
  redirectMock: vi.fn((url: string): never => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  getSessionMock: vi.fn<() => Promise<Session | null>>(),
  headersMock: vi.fn(async () => new Headers()),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));
vi.mock("next/headers", () => ({
  headers: headersMock,
}));
vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: getSessionMock,
    },
  },
}));

import {
  checkPermissions,
  defaultRedirectForUser,
  redirectToUserDefault,
  requireNotAuth,
  requirePermission,
  requireStatus,
} from "@/lib/auth/guard";

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    name: "Test",
    lastName: "User",
    email: "test@example.com",
    emailVerified: true,
    image: null,
    role: Role.volunteer,
    status: UserStatus.active,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeSession(user: User): Session {
  return {
    user,
    session: {
      id: "00000000-0000-4000-8000-000000000099",
      userId: user.id,
      token: "session-token",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
      ipAddress: null,
      userAgent: null,
    },
  };
}

const STATUS_TO_ROUTE: Record<UserStatus, string> = {
  [UserStatus.active]: "/",
  [UserStatus.unverified]: "/unverified",
  [UserStatus.inactive]: "/inactive",
  [UserStatus.rejected]: "/rejected",
};

const NON_ACTIVE_STATUSES = UserStatus.values.filter(
  (status) => status !== UserStatus.active,
);

describe("auth guard routing and status enforcement", () => {
  beforeEach(() => {
    redirectMock.mockClear();
    getSessionMock.mockReset();
  });

  describe("defaultRedirectForUser", () => {
    it("routes unauthenticated users to /auth/login", () => {
      expect(defaultRedirectForUser(null)).toBe("/auth/login");
      expect(defaultRedirectForUser(undefined)).toBe("/auth/login");
    });

    it("routes every account status to an explicit destination", () => {
      for (const status of UserStatus.values) {
        expect(defaultRedirectForUser({ status })).toBe(STATUS_TO_ROUTE[status]);
      }
      expect(
        defaultRedirectForUser({ status: UserStatus.active }, "/classes"),
      ).toBe("/classes");
    });

    it("fails closed to /auth/login for unexpected status values", () => {
      expect(
        defaultRedirectForUser({ status: "unknown" as UserStatus }),
      ).toBe("/auth/login");
    });
  });

  describe("requireStatus", () => {
    for (const currentStatus of UserStatus.values) {
      it(`allows ${currentStatus} users on their own terminal route without redirecting`, async () => {
        const user = makeUser({ status: currentStatus });
        getSessionMock.mockResolvedValue(makeSession(user));

        const result = await requireStatus(currentStatus);
        expect(result).toEqual(user);
        expect(redirectMock).not.toHaveBeenCalled();
      });

      for (const requiredStatus of UserStatus.values) {
        if (requiredStatus === currentStatus) continue;

        it(`redirects ${currentStatus} users from ${requiredStatus}-only routes to ${STATUS_TO_ROUTE[currentStatus]}`, async () => {
          const user = makeUser({ status: currentStatus });
          getSessionMock.mockResolvedValue(makeSession(user));

          await expect(requireStatus(requiredStatus)).rejects.toThrow(
            `NEXT_REDIRECT:${STATUS_TO_ROUTE[currentStatus]}`,
          );
          expect(redirectMock).toHaveBeenCalledWith(
            STATUS_TO_ROUTE[currentStatus],
          );
        });
      }
    }

    it("redirects unauthenticated users to /auth/login", async () => {
      getSessionMock.mockResolvedValue(null);

      await expect(requireStatus(UserStatus.active)).rejects.toThrow(
        "NEXT_REDIRECT:/auth/login",
      );
      await expect(requireStatus(UserStatus.rejected)).rejects.toThrow(
        "NEXT_REDIRECT:/auth/login",
      );
    });
  });

  describe("requireNotAuth and redirectToUserDefault", () => {
    it("allows unauthenticated users on public auth routes", async () => {
      getSessionMock.mockResolvedValue(null);

      await expect(requireNotAuth()).resolves.toBeUndefined();
      expect(redirectMock).not.toHaveBeenCalled();
    });

    it("redirects authenticated users from public auth routes to their status destination", async () => {
      for (const status of UserStatus.values) {
        const expectedRoute = STATUS_TO_ROUTE[status];
        getSessionMock.mockResolvedValue(makeSession(makeUser({ status })));

        await expect(requireNotAuth()).rejects.toThrow(
          `NEXT_REDIRECT:${expectedRoute}`,
        );
        await expect(redirectToUserDefault()).rejects.toThrow(
          `NEXT_REDIRECT:${expectedRoute}`,
        );
      }
    });

    it("redirects unauthenticated users from redirectToUserDefault to /auth/login", async () => {
      getSessionMock.mockResolvedValue(null);

      await expect(redirectToUserDefault()).rejects.toThrow(
        "NEXT_REDIRECT:/auth/login",
      );
    });
  });

  describe("requirePermission and checkPermissions", () => {
    it("allows active admins with required permission", async () => {
      const admin = makeUser({ role: Role.admin, status: UserStatus.active });
      getSessionMock.mockResolvedValue(makeSession(admin));

      await expect(
        checkPermissions({ permission: { users: ["view"] } }),
      ).resolves.toBe(true);
      await expect(
        requirePermission({ permission: { users: ["view"] } }),
      ).resolves.toEqual(admin);
    });

    it("redirects active users missing permission to / (or custom fallback)", async () => {
      const volunteer = makeUser({
        role: Role.volunteer,
        status: UserStatus.active,
      });
      getSessionMock.mockResolvedValue(makeSession(volunteer));

      await expect(
        checkPermissions({ permission: { users: ["view"] } }),
      ).resolves.toBe(false);
      await expect(
        requirePermission({ permission: { users: ["view"] } }),
      ).rejects.toThrow("NEXT_REDIRECT:/");
      await expect(
        requirePermission({ permission: { users: ["view"] } }, "/classes"),
      ).rejects.toThrow("NEXT_REDIRECT:/classes");
    });

    it("denies and redirects non-active admins directly to their status page", async () => {
      for (const status of NON_ACTIVE_STATUSES) {
        const expectedRoute = STATUS_TO_ROUTE[status];
        const nonActiveAdmin = makeUser({ role: Role.admin, status });
        getSessionMock.mockResolvedValue(makeSession(nonActiveAdmin));

        await expect(
          checkPermissions({ permission: { users: ["view"] } }),
        ).resolves.toBe(false);
        await expect(
          requirePermission({ permission: { users: ["view"] } }),
        ).rejects.toThrow(`NEXT_REDIRECT:${expectedRoute}`);
      }
    });

    it("denies and redirects unauthenticated users to /auth/login", async () => {
      getSessionMock.mockResolvedValue(null);

      await expect(
        checkPermissions({ permission: { users: ["view"] } }),
      ).resolves.toBe(false);
      await expect(
        requirePermission({ permission: { users: ["view"] } }),
      ).rejects.toThrow("NEXT_REDIRECT:/auth/login");
    });
  });
});
