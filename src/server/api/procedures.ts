import type { Permissions } from "@/lib/auth/extensions/permissions";
import { isAuthorized } from "./middleware/authorizationMiddleware";
import { serviceAvailabilityMiddleware } from "./middleware/serviceAvailabilityMiddleware";
import { timingMiddleware } from "./middleware/timingMiddleware";
import { trpc } from "./trpc";

const baseProcedure = trpc.procedure
  .use(serviceAvailabilityMiddleware)
  .use(timingMiddleware);

export const publicProcedure = baseProcedure;
export const authorizedProcedure = (permissions?: Permissions) =>
  baseProcedure.use(isAuthorized(permissions));
