"use client";

import {
  hasPermission,
  type Permissions,
} from "@/lib/auth/extensions/permissions";
import { useAuth } from "@/providers/client-auth-provider";

export function usePermission(permissions?: Permissions): boolean {
  const { user } = useAuth();

  if (permissions === undefined) {
    return true;
  }

  return hasPermission({ ...permissions, user });
}
