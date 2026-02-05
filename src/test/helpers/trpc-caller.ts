import { createCaller } from "@/server/api/root";
import type { Session } from "@/lib/auth";
import { createTestContainer, type TestContainerOptions } from "../test-container";
import { getTestDb } from "../test-db";
import { user, volunteer } from "@/server/db/schema";
import { randomUUID } from "crypto";

export interface TestUser {
  id: string;
  name: string;
  lastName: string;
  email: string;
  role: "admin" | "instructor" | "volunteer";
  status?: "unverified" | "rejected" | "active" | "inactive";
}

export interface CreateTestCallerOptions extends TestContainerOptions {
  /**
   * Create an authenticated caller with a specific user.
   * The user will be inserted into the test database.
   */
  asUser?: TestUser;
}

/**
 * Creates a tRPC caller for testing with full DI container support.
 */
export async function createTestCaller(options: CreateTestCallerOptions = {}) {
  const { asUser, ...containerOptions } = options;

  let session: Session | undefined;

  if (asUser) {
    // Insert user into test database
    const db = getTestDb();
    await db.insert(user).values({
      id: asUser.id,
      name: asUser.name,
      lastName: asUser.lastName,
      email: asUser.email,
      role: asUser.role,
      status: asUser.status ?? "active",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // If volunteer, create volunteer profile
    if (asUser.role === "volunteer") {
      await db.insert(volunteer).values({
        userId: asUser.id,
      });
    }

    // Build session
    session = {
      user: {
        id: asUser.id,
        name: asUser.name,
        lastName: asUser.lastName,
        email: asUser.email,
        role: asUser.role,
        status: asUser.status ?? "active",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        image: null,
      },
      session: {
        id: `test-session-${Date.now()}`,
        userId: asUser.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
        token: "test-token",
        ipAddress: null,
        userAgent: null,
      },
    };
  }

  const container = createTestContainer({
    ...containerOptions,
    session,
  });

  return createCaller(container.cradle);
}

/**
 * Creates a caller authenticated as an admin user.
 */
export async function createAdminCaller() {
  return createTestCaller({
    asUser: {
      id: randomUUID(),
      name: "Test",
      lastName: "Admin",
      email: `admin-${Date.now()}@test.com`,
      role: "admin",
    },
  });
}

/**
 * Creates a caller authenticated as a volunteer user.
 */
export async function createVolunteerCaller() {
  return createTestCaller({
    asUser: {
      id: randomUUID(),
      name: "Test",
      lastName: "Volunteer",
      email: `volunteer-${Date.now()}@test.com`,
      role: "volunteer",
    },
  });
}

/**
 * Creates a caller authenticated as an instructor user.
 */
export async function createInstructorCaller() {
  return createTestCaller({
    asUser: {
      id: randomUUID(),
      name: "Test",
      lastName: "Instructor",
      email: `instructor-${Date.now()}@test.com`,
      role: "instructor",
    },
  });
}

/**
 * Creates an unauthenticated caller (no session).
 */
export function createUnauthenticatedCaller() {
  return createTestCaller();
}
