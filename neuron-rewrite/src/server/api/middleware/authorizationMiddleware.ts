import { Role } from "@/models/interfaces";
import { createTRPCMiddleware } from "@/server/api/trpc";
import { wrapIfNotArray } from "@/utils/arrayUtils";
import { TRPCError } from "@trpc/server";

const authMiddleware = (roles?: Role | Role[]) =>
    createTRPCMiddleware(({ ctx, next }) => {
        if (!ctx.session) {
            throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        if (roles) {
            const rolesArray = wrapIfNotArray(roles);
            if (!rolesArray.includes(ctx.session.user.role as Role)) {
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

export const isAuthorized = authMiddleware();
export const isAdmin = authMiddleware(Role.admin);
export const isVolunteer = authMiddleware(Role.volunteer);