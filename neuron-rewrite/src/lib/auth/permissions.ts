import type { auth } from "@/lib/auth";
import { Role } from "@/models/interfaces";
import { createAccessControl } from "better-auth/plugins/access";
import type { AdminOptions } from "better-auth/plugins/admin";
 
/**
 * make sure to use `as const` so typescript can infer the type correctly
 */
const statement = { 
    classes: ["view", "add-term", "delete-term", "create", "update", "delete"],
    schedule: ["view", "view-all", "view-coverage", "cancel", "check-in", "override-check-in"],
    coverage: ["view"],
    volunteerPreferences: ["view", "update"],
    users: ["view-volunteer", "invite", "activate", "suspend", "view-instructor"],
    logs: ["view"]
} as const; 
 
const ac = createAccessControl(statement); 

const admin = ac.newRole({
    classes: ["view", "add-term", "delete-term", "create", "update", "delete"],
    schedule: ["view", "view-all", "cancel", "override-check-in"],
    coverage: ["view"],
    users: ["view-volunteer", "invite", "activate", "suspend", "view-instructor"],
    logs: ["view"]
});

const volunteer = ac.newRole({
    classes: ["view"],
    schedule: ["view", "view-coverage", "check-in"],
    volunteerPreferences: ["view", "update"],
});

const instructor = ac.newRole({
    classes: ["view", "update"],
    schedule: ["view"],
    users: ["view-volunteer"]
});

export const adminPluginConfig: AdminOptions = {
    ac: ac,
    defaultRole: Role.volunteer,
    roles: {
        [Role.admin]: admin,
        [Role.volunteer]: volunteer,
        [Role.instructor]: instructor
    }
}

type Statement = typeof statement;
type Resource = keyof Statement;
type Action<R extends Resource = Resource> = Statement[R][number];

type WidePermissions = Parameters<typeof auth.api.userHasPermission>[0]['body']['permissions'];
type NarrowPermissions = Partial<{ readonly [R in Resource]: ReadonlyArray<Action<R>>; }>;

export type Permissions = WidePermissions & NarrowPermissions;