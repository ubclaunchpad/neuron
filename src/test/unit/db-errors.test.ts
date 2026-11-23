import { describe, expect, it } from "vitest";
import { DrizzleQueryError } from "drizzle-orm";
import { isUniqueViolation } from "@/server/db/errors";

describe("isUniqueViolation", () => {
  it("detects SQLSTATE 23505 inside DrizzleQueryError.cause", () => {
    const pgError = Object.assign(
      new Error('duplicate key value violates unique constraint "user_email_unique"'),
      { code: "23505" },
    );
    const wrapped = new DrizzleQueryError("insert into ...", [], pgError);

    expect(isUniqueViolation(wrapped)).toBe(true);
  });

  it("detects raw driver errors with code 23505", () => {
    const pgError = Object.assign(new Error("duplicate key"), {
      code: "23505",
    });

    expect(isUniqueViolation(pgError)).toBe(true);
  });

  it("returns false for unrelated DrizzleQueryError causes", () => {
    const pgError = Object.assign(new Error("foreign key violation"), {
      code: "23503",
    });
    const wrapped = new DrizzleQueryError("insert into ...", [], pgError);

    expect(isUniqueViolation(wrapped)).toBe(false);
  });

  it("returns false for non-object values", () => {
    expect(isUniqueViolation(null)).toBe(false);
    expect(isUniqueViolation("23505")).toBe(false);
  });
});
