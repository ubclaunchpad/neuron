import { createTRPCMiddleware } from "@/server/api/trpc";
import { rethrowServiceUnavailable } from "@/server/errors/service-unavailable";

/** Converts backing-service connection failures into an HTTP 503 response. */
export const serviceAvailabilityMiddleware = createTRPCMiddleware(
  async ({ next }) => {
    try {
      return await next();
    } catch (error) {
      rethrowServiceUnavailable(error);
    }
  },
);
