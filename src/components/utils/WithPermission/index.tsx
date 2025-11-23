"use client";

import {
  hasPermission,
  type Permissions,
} from "@/lib/auth/extensions/permissions";
import { useAuth } from "@/providers/client-auth-provider";

export function WithPermission({
  permissions,
  fallback = null,
  children,
}: {
  permissions?: Permissions;
  fallback?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const { user } = useAuth();

  if (permissions === undefined) {
    return children;
  }

  if (!user) {
    return fallback;
  }

  const allowed = hasPermission({ ...permissions, user });
  return !allowed ? fallback : children;
}
