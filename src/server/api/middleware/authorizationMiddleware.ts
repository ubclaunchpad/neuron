import {
  hasPermission,
  type Permissions,
} from "@/lib/auth/extensions/permissions";
import { UserStatus } from "@/models/interfaces";
import { createTRPCMiddleware } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

const authMiddleware = (permissions?: Permissions) =>
  createTRPCMiddleware(({ ctx, next }) => {
    const user = ctx.currentSessionService.getUser();

    if (!user || user.status !== UserStatus.active) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    if (permissions) {
      if (!hasPermission({ ...permissions, user })) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
    }

    return next({ ctx });
  });

export const isAuthorized = (permissions?: Permissions) =>
  authMiddleware(permissions);
