import { auth, type Session, type User } from "@/lib/auth";
import type { Permissions } from "@/lib/auth/permissions";
import { Status } from "@/models/interfaces";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

function defaultRedirectForUser(user?: User | null): string {
  if (!user) return "/auth/login";
  if (user.status === Status.pending)   return "/unverified";
  if (user.status === Status.inactive)  return "/inactive";
  return "/";
}

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

export async function requireStatus(status: Status): Promise<User> {
  const session = await getSession();
  if (session?.user?.status === status) {
    return session.user;
  }
  redirect(defaultRedirectForUser(session?.user));
}

async function getActiveUser(): Promise<User | null> {
  const session = await getSession();
  return session?.user?.status === Status.active ? session.user : null;
}

async function resolveActiveUserAndPermission(permissions: Permissions): Promise<{ user: User | null; allowed: boolean }> {
  const user = await getActiveUser();
  if (!user) return { user: null, allowed: false };

  const { success } = await auth.api.userHasPermission({
    body: { userId: user.id, permissions }
  });

  return { user, allowed: success };
}

export async function checkPermissions(permissions: Permissions): Promise<boolean> {
  const { allowed } = await resolveActiveUserAndPermission(permissions);
  return allowed;
}

export async function requirePermission(permissions: Permissions): Promise<User> {
  const { user, allowed } = await resolveActiveUserAndPermission(permissions);
  if (!user || !allowed) redirect(defaultRedirectForUser(user));
  return user;
}
