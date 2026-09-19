import { TRPCError } from "@trpc/server";

export const SERVICE_UNAVAILABLE_MESSAGE =
  "The service is temporarily unavailable. Please try again shortly.";

const CONNECTION_ERROR_CODES = new Set([
  "ECONNREFUSED",
  "ECONNRESET",
  "EHOSTUNREACH",
  "ENETUNREACH",
  "EPIPE",
  "ETIMEDOUT",
  "CONNECTION_CLOSED",
  "CONNECTION_DESTROYED",
  "CONNECTION_ENDED",
  // PostgreSQL server shutdown / cannot connect now.
  "57P01",
  "57P02",
  "57P03",
]);

type ErrorLike = {
  code?: unknown;
  cause?: unknown;
  errors?: unknown;
};

/**
 * Identifies failures caused by an unavailable backing service without
 * misclassifying application errors as availability incidents.
 */
export function isServiceUnavailableError(error: unknown): boolean {
  return isServiceUnavailableErrorInner(error, new Set());
}

function isServiceUnavailableErrorInner(
  error: unknown,
  visited: Set<object>,
): boolean {
  if (!error || typeof error !== "object" || visited.has(error)) return false;
  visited.add(error);

  const errorLike = error as ErrorLike;
  if (typeof errorLike.code === "string") {
    if (CONNECTION_ERROR_CODES.has(errorLike.code)) return true;
    // PostgreSQL class 08: connection exception.
    if (/^08[0-9A-Z]{3}$/.test(errorLike.code)) return true;
  }

  if (isServiceUnavailableErrorInner(errorLike.cause, visited)) return true;

  if (Array.isArray(errorLike.errors)) {
    return errorLike.errors.some((nestedError) =>
      isServiceUnavailableErrorInner(nestedError, visited),
    );
  }

  return false;
}

export function rethrowServiceUnavailable(error: unknown): never {
  if (isServiceUnavailableError(error)) {
    throw new TRPCError({
      code: "SERVICE_UNAVAILABLE",
      message: SERVICE_UNAVAILABLE_MESSAGE,
      cause: error,
    });
  }

  throw error;
}
