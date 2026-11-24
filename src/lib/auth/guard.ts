import { auth, type Session, type User } from "@/lib/auth";
import {
  hasPermission,
  type Permissions,
} from "@/lib/auth/extensions/permissions";
import { UserStatus } from "@/models/interfaces";
import type { Route } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

// Utility functions
export function defaultRedirectForUser(
  user?: Pick<User, "status"> | null,
  fallback?: Route,
): Route {
  if (!user) return "/auth/login";
  switch (user.status) {
    case UserStatus.unverified:
      return "/unverified";
    case UserStatus.inactive:
      return "/inactive";
    case UserStatus.rejected:
      return "/rejected";
    case UserStatus.active:
      return fallback ?? "/";
    default:
      return "/auth/login";
  }
}

async function resolveSessionAndPermission(
  permissions: Permissions,
): Promise<{ user: User | null; allowed: boolean }> {
  const session = await getSession();
  const user = session?.user ?? null;
  if (!user || user.status !== UserStatus.active) {
    return { user, allowed: false };
  }

  const success = hasPermission({ ...permissions, user });

  return { user, allowed: success };
}

// Guards
export async function getSession(): Promise<Session | null> {
  const h = new Headers(await headers());
  try {
    return await auth.api.getSession({ headers: h });
  } catch (err) {
    console.error("[auth] getSession failed", err);

    // fail closed: behave like unauthenticated.
    return null;
  }
}

export async function requireNotAuth(): Promise<void> {
  const session = await getSession();
  if (session) redirect(defaultRedirectForUser(session.user));
}

export async function redirectToUserDefault(): Promise<void> {
  const session = await getSession();
  redirect(defaultRedirectForUser(session?.user));
}

export async function requireStatus(
  status: UserStatus,
  fallback?: Route,
): Promise<User> {
  const session = await getSession();
  if (session?.user?.status === status) {
    return session.user;
  }
  redirect(defaultRedirectForUser(session?.user, fallback));
}

export async function checkPermissions(
  permission: Permissions,
): Promise<boolean> {
  const { allowed } = await resolveSessionAndPermission(permission);
  return allowed;
}

export async function requirePermission(
  permission: Permissions,
  fallback?: Route,
): Promise<User> {
  const { user, allowed } = await resolveSessionAndPermission(permission);
  if (!user || !allowed) {
    redirect(defaultRedirectForUser(user, fallback));
  }
  return user;
}
