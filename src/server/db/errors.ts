const PG_UNIQUE_VIOLATION = "23505";

/**
 * Check whether an error thrown by Drizzle (or directly by postgres-js)
 * represents a PostgreSQL unique constraint violation (SQLSTATE 23505).
 *
 * Since Drizzle ORM v0.44+, query failures are wrapped in `DrizzleQueryError`
 * with the underlying driver error attached as `error.cause`. We walk the
 * `.cause` chain and treat any explicit SQLSTATE `code` as authoritative so
 * unrelated errors whose messages mention "unique" are not misclassified.
 */
export function isUniqueViolation(error: unknown): boolean {
  const visited = new Set<unknown>();
  let current: unknown = error;

  while (
    typeof current === "object" &&
    current !== null &&
    !visited.has(current)
  ) {
    visited.add(current);

    if ("code" in current && typeof current.code === "string") {
      return current.code === PG_UNIQUE_VIOLATION;
    }

    current = "cause" in current ? current.cause : undefined;
  }

  return false;
}
