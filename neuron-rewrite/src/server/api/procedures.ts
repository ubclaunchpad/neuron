import { isAdmin, isAuthorized } from "./middleware/authorizationMiddleware";
import { timingMiddleware } from "./middleware/timingMiddleware";
import { trpc } from "./trpc";

export const publicProcedure = trpc.procedure.use(timingMiddleware);
export const authorizedProcedure = trpc.procedure.use(timingMiddleware).use(isAuthorized);
export const adminProcedure = trpc.procedure.use(timingMiddleware).use(isAdmin);