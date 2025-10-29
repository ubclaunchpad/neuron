import { auth, type Session, type User } from "@/lib/auth";
import {
  hasPermission,
  type Permissions,
} from "@/lib/auth/extensions/permissions";
import { Status } from "@/models/interfaces";
import type { Route } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

// Utility functions
function defaultRedirectForUser(user?: User | null, fallback?: Route): Route {
  if (!user) return "/auth/login";
  if (user.status === Status.unverified) return "/unverified";
  if (user.status === Status.inactive) return "/inactive";
  return fallback ?? "/";
}

async function getActiveUser(): Promise<User | null> {
  const session = await getSession();
  return session?.user?.status === Status.active ? session.user : null;
}

async function resolveActiveUserAndPermission(
  permissions: Permissions,
): Promise<{ user: User | null; allowed: boolean }> {
  const user = await getActiveUser();
  if (!user) return { user: null, allowed: false };

  const success = hasPermission({ ...permissions, user });

  return { user, allowed: success };
}

// Guards
export async function getSession(): Promise<Session | null> {
  const h = new Headers(await headers());
  return auth.api.getSession({ headers: h });
}

export async function requireNotAuth(): Promise<void> {
  const session = await getSession();
  if (session) redirect(defaultRedirectForUser(session.user));
}

export async function redirectToUserDefault(): Promise<void> {
  const session = await getSession();
  redirect(defaultRedirectForUser(session?.user));
}

export async function requireStatus(status: Status, fallback?: Route): Promise<User> {
  const session = await getSession();
  if (session?.user?.status === status) {
    return session.user;
  }
  redirect(defaultRedirectForUser(session?.user, fallback));
}

export async function checkPermissions(
  permission: Permissions,
): Promise<boolean> {
  const { allowed } = await resolveActiveUserAndPermission(permission);
  return allowed;
}

export async function requirePermission(
  permission: Permissions,
  fallback?: Route,
): Promise<User> {
  const { user, allowed } = await resolveActiveUserAndPermission(permission);
  if (!user || !allowed) redirect(defaultRedirectForUser(user, fallback));
  return user;
}
