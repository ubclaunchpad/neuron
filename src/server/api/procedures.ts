import type { Permissions } from "@/lib/auth/extensions/permissions";
import { isAuthorized } from "./middleware/authorizationMiddleware";
import { timingMiddleware } from "./middleware/timingMiddleware";
import { trpc } from "./trpc";

export const publicProcedure = trpc.procedure.use(timingMiddleware);
export const authorizedProcedure = (permissions?: Permissions) =>
  trpc.procedure.use(timingMiddleware).use(isAuthorized(permissions));
