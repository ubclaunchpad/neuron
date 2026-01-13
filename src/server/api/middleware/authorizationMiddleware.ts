import {
  hasPermission,
  type Permissions,
} from "@/lib/auth/extensions/permissions";
import { UserStatus } from "@/models/interfaces";
import { createTRPCMiddleware } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

const authMiddleware = (permissions?: Permissions) =>
  createTRPCMiddleware(({ ctx, next }) => {
    if (!ctx.session || ctx.session.user.status !== UserStatus.active) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    if (permissions) {
      if (!hasPermission({ ...permissions, user: ctx.session.user })) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
    }

    // pass-through with session guaranteed
    return next({
      ctx: {
        ...ctx,
        session: ctx.session,
      },
    });
  });

export const isAuthorized = (permissions?: Permissions) =>
  authMiddleware(permissions);
