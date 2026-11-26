import { describe, expect, it } from "vitest";
import { DrizzleQueryError } from "drizzle-orm";
import { isUniqueViolation } from "@/server/db/errors";

describe("isUniqueViolation", () => {
  it("detects SQLSTATE 23505 inside DrizzleQueryError.cause", () => {
    const pgError = Object.assign(
      new Error(
        'duplicate key value violates unique constraint "user_email_unique"',
      ),
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

  it("walks nested .cause chains", () => {
    const pgError = Object.assign(new Error("duplicate key"), {
      code: "23505",
    });
    const inner = new Error("query failed", { cause: pgError });
    const outer = new Error("service failed", { cause: inner });

    expect(isUniqueViolation(outer)).toBe(true);
  });

  it("returns false for unrelated DrizzleQueryError causes", () => {
    const pgError = Object.assign(new Error("foreign key violation"), {
      code: "23503",
    });
    const wrapped = new DrizzleQueryError("insert into ...", [], pgError);

    expect(isUniqueViolation(wrapped)).toBe(false);
  });

  it("does not misclassify non-23505 SQLSTATE errors whose message mentions 'unique'", () => {
    const permissionError = Object.assign(
      new Error('permission denied for table "unique_records"'),
      { code: "42501" },
    );
    const onConflictError = Object.assign(
      new Error(
        "there is no unique or exclusion constraint matching the ON CONFLICT specification",
      ),
      { code: "42P10" },
    );

    expect(
      isUniqueViolation(
        new DrizzleQueryError("insert ...", [], permissionError),
      ),
    ).toBe(false);
    expect(
      isUniqueViolation(
        new DrizzleQueryError("insert ...", [], onConflictError),
      ),
    ).toBe(false);
  });

  it("handles DrizzleQueryError with undefined cause and cyclic cause chains", () => {
    const noCause = new DrizzleQueryError("insert ...", [], undefined);
    expect(isUniqueViolation(noCause)).toBe(false);

    const cyclic: { cause?: unknown } = {};
    cyclic.cause = cyclic;
    expect(isUniqueViolation(cyclic)).toBe(false);
  });

  it("returns false for non-object values", () => {
    expect(isUniqueViolation(null)).toBe(false);
    expect(isUniqueViolation("23505")).toBe(false);
  });
});
