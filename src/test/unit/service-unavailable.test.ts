import { TRPCError } from "@trpc/server";
import { getHTTPStatusCodeFromError } from "@trpc/server/http";
import { describe, expect, it } from "vitest";
import {
  isServiceUnavailableError,
  rethrowServiceUnavailable,
} from "@/server/errors/service-unavailable";

describe("service unavailable errors", () => {
  it.each(["ECONNREFUSED", "ETIMEDOUT", "08006", "57P03"])(
    "recognizes backing-service error code %s",
    (code) => {
      expect(isServiceUnavailableError({ code })).toBe(true);
    },
  );

  it("recognizes connection failures nested in aggregate errors", () => {
    const error = new AggregateError([
      Object.assign(new Error("connect failed"), { code: "ECONNREFUSED" }),
    ]);

    expect(isServiceUnavailableError(error)).toBe(true);
  });

  it("does not turn application failures into availability errors", () => {
    expect(isServiceUnavailableError(new Error("broken invariant"))).toBe(
      false,
    );
  });

  it("maps recognized failures to a 503 tRPC error", () => {
    try {
      rethrowServiceUnavailable({ code: "ECONNREFUSED" });
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
      expect((error as TRPCError).code).toBe("SERVICE_UNAVAILABLE");
      expect(getHTTPStatusCodeFromError(error as TRPCError)).toBe(503);
    }
  });
});
