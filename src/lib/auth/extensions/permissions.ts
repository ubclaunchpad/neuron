import type { User } from "@/lib/auth";
import { Role } from "@/models/interfaces";
import {
  createAccessControl,
  type Role as AccessRole,
} from "better-auth/plugins/access";

/**
 * Access control statements define the available permissions for each resource.
 * Each resource maps to an array of actions that can be performed on that resource.
 * These statements are used by the access control system to create roles with specific permissions.
 */
const accessControl = createAccessControl({
  classes: ["view", "create", "update", "delete", "prefer"],
  terms: ["view", "create", "delete"],
  shifts: ["view", "view-all", "cancel", "check-in", "override-check-in"],
  coverage: ["view", "request", "fill"],
  profile: ["view", "update"],
  "volunteer-profile": ["view", "update"],
  users: ["view", "create", "update", "activate", "deactivate", "invite"],
  logs: ["view"],
} as const);

const admin = accessControl.newRole({
  classes: ["view", "create", "update", "delete"],
  terms: ["view", "create", "delete"],
  shifts: ["view", "view-all", "cancel", "override-check-in"],
  coverage: ["view"],
  users: ["view", "create", "update", "activate", "deactivate", "invite"],
  logs: ["view"],
  profile: ["view", "update"],
});

const volunteer = accessControl.newRole({
  classes: ["view", "prefer"],
  terms: ["view"],
  shifts: ["view", "check-in"],
  profile: ["view", "update"],
  "volunteer-profile": ["view", "update"],
  coverage: ["view", "request", "fill"],
});

const instructor = accessControl.newRole({
  classes: ["view"],
  terms: ["view"],
  shifts: ["view"],
  profile: ["view", "update"],
});

const roleToAccessControlRole: Record<Role, AccessRole> = {
  [Role.admin]: admin,
  [Role.volunteer]: volunteer,
  [Role.instructor]: instructor,
};

type UserRoleExclusive =
  | { user?: User; role?: never }
  | { role?: Role; user?: never };
export type Permissions =
  | { permission: PermissionStatement; permissions?: never }
  | { permissions: PermissionStatements; permission?: never };

/**
 * Check if the user has the given permission
 * Taken from better-auth/plugins/admin
 * This can be used on the server or client
 * @param input.permission - The permission to check
 * @param input.user - The user to check the permission for
 * @param input.role - The role to check the permission for
 * @returns boolean
 */
export const hasPermission = (
  input: Permissions & UserRoleExclusive,
): boolean => {
  if (
    (!input.permissions && !input.permission) ||
    (!input.user?.role && !input.role)
  ) {
    return false;
  }

  const roleToCheck = input.user ? input.user.role : input.role;
  const role = roleToAccessControlRole[roleToCheck as Role]; // We know this is safe because we check above

  if (input.permissions) {
    return role?.authorize(
      input.permissions.statements,
      input.permissions.connector,
    )?.success;
  } else {
    return role?.authorize(input.permission)?.success;
  }
};

type Statement = typeof accessControl.statements;
type Resource = keyof Statement;
type Action<R extends Resource = Resource> = Statement[R][number];

/**
 * PermissionStatement is a partial object that maps resources to actions.
 * This is used to check if a user has a specific permission for a resource.
 */
type PermissionStatement = Partial<{
  readonly [R in Resource]: ReadonlyArray<Action<R>>;
}>;
type PermissionStatements = {
  statements: PermissionStatement[];
  connector?: "AND" | "OR";
};
