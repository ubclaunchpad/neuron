import { DrizzleQueryError } from "drizzle-orm";

const PG_UNIQUE_VIOLATION = "23505";

/**
 * Check whether an error thrown by Drizzle (or directly by postgres-js)
 * represents a PostgreSQL unique constraint violation (SQLSTATE 23505).
 *
 * Since Drizzle ORM v0.44+, query failures are wrapped in `DrizzleQueryError`
 * with the underlying driver error attached as `error.cause`.
 */
export function isUniqueViolation(error: unknown): boolean {
  const driverError = error instanceof DrizzleQueryError ? error.cause : error;

  if (typeof driverError === "object" && driverError !== null) {
    if ("code" in driverError && driverError.code === PG_UNIQUE_VIOLATION) {
      return true;
    }
    if (
      "message" in driverError &&
      typeof driverError.message === "string" &&
      driverError.message.toLowerCase().includes("unique")
    ) {
      return true;
    }
  }

  return false;
}
