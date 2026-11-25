import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from "@/server/db/schema";
import { DirectProvisionRoleEnum } from "@/models/api/user";
import {
  Role,
  RoleEnum,
  UserStatus,
  UserStatusEnum,
} from "@/models/interfaces";
import type { Drizzle, Transaction } from "@/server/db";
import { user, volunteer, type UserDB } from "@/server/db/schema/user";
import { NeuronError, NeuronErrorCodes } from "@/server/errors/neuron-error";
import { normalizeEmail } from "@/utils/emailUtils";
import { eq } from "drizzle-orm";

type DbExecutor = Drizzle | Transaction;

export interface ProvisionUserInput {
  name: string;
  lastName: string;
  email: string;
  role: string;
  status: UserStatus;
  emailVerified?: boolean;
}

export function assertDirectProvisionRole(role: string): Role {
  const parsed = DirectProvisionRoleEnum.safeParse(role);
  if (!parsed.success) {
    if (role === Role.volunteer) {
      throw new NeuronError(
        "Volunteers cannot be created directly; use self-registration or invitation provisioning",
        NeuronErrorCodes.BAD_REQUEST,
      );
    }

    throw new NeuronError(
      `Unsupported role for direct user creation: ${role}`,
      NeuronErrorCodes.BAD_REQUEST,
    );
  }

  return parsed.data;
}

export function parseProvisionRole(role: unknown): Role {
  const parsed = RoleEnum.safeParse(role);
  if (!parsed.success) {
    throw new NeuronError(
      `Invalid user role: ${String(role)}`,
      NeuronErrorCodes.BAD_REQUEST,
    );
  }
  return parsed.data;
}

export function parseProvisionStatus(status: unknown): UserStatus {
  const parsed = UserStatusEnum.safeParse(status);
  if (!parsed.success) {
    throw new NeuronError(
      `Invalid user status: ${String(status)}`,
      NeuronErrorCodes.BAD_REQUEST,
    );
  }
  return parsed.data;
}

/**
 * Enforces the role <-> volunteer profile invariant:
 * - volunteers MUST have a corresponding row in `volunteer`
 * - non-volunteers (admin, instructor) MUST NOT have a row in `volunteer`
 */
export async function syncVolunteerProfile(
  executor: DbExecutor,
  { userId, role }: { userId: string; role: Role },
): Promise<void> {
  switch (role) {
    case Role.volunteer:
      await executor
        .insert(volunteer)
        .values({ userId })
        .onConflictDoNothing({ target: volunteer.userId });
      return;
    case Role.instructor:
    case Role.admin:
      await executor.delete(volunteer).where(eq(volunteer.userId, userId));
      return;
  }
}

/**
 * Atomically inserts a user with normalized email, validated role/status,
 * and ensures the required volunteer profile exists in the same transaction
 * when provisioning a volunteer.
 */
export async function provisionUser(
  db: Drizzle,
  input: ProvisionUserInput,
): Promise<UserDB> {
  const role = parseProvisionRole(input.role);
  const status = parseProvisionStatus(input.status);
  const email = normalizeEmail(input.email);

  return await db.transaction(async (tx) => {
    const [createdUser] = await tx
      .insert(user)
      .values({
        name: input.name,
        lastName: input.lastName,
        email,
        role,
        status,
        emailVerified: input.emailVerified ?? false,
      })
      .returning();

    if (!createdUser) {
      throw new NeuronError(
        "Failed to create user",
        NeuronErrorCodes.INTERNAL_SERVER_ERROR,
      );
    }

    await syncVolunteerProfile(tx, { userId: createdUser.id, role });

    return createdUser;
  });
}

/**
 * Atomically applies an accepted invitation's role, active status, normalized
 * email, and volunteer-profile invariant in a single transaction.
 */
export async function reconcileInvitedUser(
  db: Drizzle,
  input: {
    userId: string;
    role: unknown;
    email?: string;
  },
): Promise<void> {
  const role = parseProvisionRole(input.role);

  await db.transaction(async (tx) => {
    const updatePayload: Partial<typeof user.$inferInsert> = {
      role,
      status: UserStatus.active,
    };

    if (input.email !== undefined) {
      updatePayload.email = normalizeEmail(input.email);
    }

    const [updatedUser] = await tx
      .update(user)
      .set(updatePayload)
      .where(eq(user.id, input.userId))
      .returning({ id: user.id });

    if (!updatedUser) {
      throw new NeuronError(
        `Could not find user with id ${input.userId}`,
        NeuronErrorCodes.NOT_FOUND,
      );
    }

    await syncVolunteerProfile(tx, { userId: input.userId, role });
  });
}

/**
 * Normalizes `email` / `newEmail` fields on incoming Better Auth endpoint bodies
 * before endpoint validation, lookup, or persistence runs (including app-invite).
 */
export function normalizeAuthRequestEmailBody(
  body: unknown,
): Record<string, unknown> | undefined {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return undefined;
  }

  const record = body as Record<string, unknown>;
  let changed = false;
  const next: Record<string, unknown> = { ...record };

  for (const field of ["email", "newEmail"] as const) {
    if (typeof record[field] === "string") {
      const normalized = normalizeEmail(record[field]);
      if (normalized !== record[field]) {
        next[field] = normalized;
        changed = true;
      }
    }
  }

  return changed ? next : undefined;
}

/**
 * Better Auth `databaseHooks.user.create.before` handler.
 * Enforces normalized email, valid role (defaulting to volunteer), and valid status
 * (defaulting to unverified).
 */
export function normalizeAuthUserCreateInput<
  T extends Record<string, unknown> & { email?: unknown },
>(userData: T): { data: T } {
  const role =
    userData.role === undefined
      ? Role.volunteer
      : parseProvisionRole(userData.role);
  const status =
    userData.status === undefined
      ? UserStatus.unverified
      : parseProvisionStatus(userData.status);

  const email =
    typeof userData.email === "string"
      ? normalizeEmail(userData.email)
      : userData.email;

  return {
    data: {
      ...userData,
      email,
      role,
      status,
    },
  };
}

/**
 * Better Auth `databaseHooks.user.update.before` handler.
 * Enforces email normalization and valid role/status on auth-driven updates.
 */
export function normalizeAuthUserUpdateInput<T extends Record<string, unknown>>(
  userData: T,
): { data: T } {
  const next: Record<string, unknown> = { ...userData };

  if (typeof next.email === "string") {
    next.email = normalizeEmail(next.email);
  }

  if (next.role !== undefined) {
    next.role = parseProvisionRole(next.role);
  }

  if (next.status !== undefined) {
    next.status = parseProvisionStatus(next.status);
  }

  return { data: next as T };
}

/**
 * Keep auth user/profile inserts in one transaction, before the adapter returns.
 * Better Auth after hooks run after persistence and cannot provide this guarantee.
 */
export function accountAdapter(db: Drizzle): ReturnType<typeof drizzleAdapter> {
  return (options) => {
    const adapter = drizzleAdapter(db, { provider: "pg", schema })(options);
    const create = adapter.create;
    adapter.create = async <T extends Record<string, unknown>, R = T>(
      input: Parameters<typeof create<T, R>>[0],
    ): Promise<R> => {
      if (input.model !== "user") return create<T, R>(input);
      return db.transaction(async (tx) => {
        const created = await drizzleAdapter(tx, { provider: "pg", schema })(
          options,
        ).create<T, R>(input);
        const record = created as unknown as { id: string; role?: unknown };
        await syncVolunteerProfile(tx, {
          userId: record.id,
          role: parseProvisionRole(record.role),
        });
        return created;
      });
    };
    return adapter;
  };
}
