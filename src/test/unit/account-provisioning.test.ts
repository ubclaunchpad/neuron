import { isUniqueViolation } from "@/server/db/errors";
import { describe, expect, it } from "vitest";
import {
  CreateInstructorInput,
  UpdateInstructorInput,
} from "@/models/api/instructor";
import { CreateUserInput } from "@/models/api/user";
import { NormalizedEmail } from "@/models/extensions/Email";
import { Role, UserStatus } from "@/models/interfaces";
import {
  assertDirectProvisionRole,
  normalizeAuthRequestEmailBody,
  normalizeAuthUserCreateInput,
  normalizeAuthUserUpdateInput,
} from "@/server/services/entity/accountProvisioning";
import { normalizeEmail } from "@/utils/emailUtils";

describe("email normalization and provisioning schemas", () => {
  it("normalizes mixed-case and whitespace-padded emails", () => {
    expect(normalizeEmail("  Alice.Smith@Example.COM \n")).toBe(
      "alice.smith@example.com",
    );
    expect(normalizeEmail("already@lower.org")).toBe("already@lower.org");
  });

  it("validates and normalizes emails via NormalizedEmail schema", () => {
    expect(NormalizedEmail.parse("  User+Tag@Example.COM  ")).toBe(
      "user+tag@example.com",
    );
    expect(() => NormalizedEmail.parse("not-an-email")).toThrow();
    expect(() => NormalizedEmail.parse("   ")).toThrow();
  });

  it("allows admin and instructor in CreateUserInput and rejects volunteer", () => {
    const admin = CreateUserInput.parse({
      role: Role.admin,
      name: "Ada",
      lastName: "Lovelace",
      email: "  Ada@Example.COM ",
    });
    expect(admin.role).toBe(Role.admin);
    expect(admin.email).toBe("ada@example.com");

    const instructor = CreateUserInput.parse({
      role: Role.instructor,
      name: "Grace",
      lastName: "Hopper",
      email: "Grace@Example.COM",
    });
    expect(instructor.role).toBe(Role.instructor);
    expect(instructor.email).toBe("grace@example.com");

    const volunteerResult = CreateUserInput.safeParse({
      role: Role.volunteer,
      name: "Vol",
      lastName: "Unteer",
      email: "vol@example.com",
    });
    expect(volunteerResult.success).toBe(false);
  });

  it("normalizes emails in instructor create and update schemas", () => {
    const created = CreateInstructorInput.parse({
      firstName: "Alan",
      lastName: "Turing",
      email: "  Alan.Turing@Example.ORG ",
    });
    expect(created.email).toBe("alan.turing@example.org");

    const updated = UpdateInstructorInput.parse({
      instructorId: "11111111-1111-4111-8111-111111111111",
      email: "  NEW.Alan@Example.ORG ",
    });
    expect(updated.email).toBe("new.alan@example.org");

    const updatedWithoutEmail = UpdateInstructorInput.parse({
      instructorId: "11111111-1111-4111-8111-111111111111",
      firstName: "A.",
    });
    expect(updatedWithoutEmail.email).toBeUndefined();
  });

  it("rejects volunteer and unknown roles in assertDirectProvisionRole", () => {
    expect(assertDirectProvisionRole(Role.admin)).toBe(Role.admin);
    expect(assertDirectProvisionRole(Role.instructor)).toBe(Role.instructor);
    expect(() => assertDirectProvisionRole(Role.volunteer)).toThrow(
      /Volunteers cannot be created directly/,
    );
    expect(() => assertDirectProvisionRole("superuser")).toThrow(
      /Unsupported role/,
    );
  });

  it("normalizes auth request body email and newEmail fields", () => {
    expect(
      normalizeAuthRequestEmailBody({
        email: "  Mixed@Example.COM ",
        name: "Test",
      }),
    ).toEqual({
      email: "mixed@example.com",
      name: "Test",
    });

    expect(
      normalizeAuthRequestEmailBody({
        newEmail: "  Next@Example.COM ",
      }),
    ).toEqual({
      newEmail: "next@example.com",
    });

    expect(
      normalizeAuthRequestEmailBody({
        email: "already@normalized.com",
      }),
    ).toBeUndefined();

    expect(normalizeAuthRequestEmailBody(null)).toBeUndefined();
    expect(normalizeAuthRequestEmailBody(["not-an-object"])).toBeUndefined();
  });

  it("normalizes auth user create and update hook payloads", () => {
    const created = normalizeAuthUserCreateInput({
      email: "  New.User@Example.COM ",
      name: "New",
    });
    expect(created.data).toEqual({
      email: "new.user@example.com",
      name: "New",
      role: Role.volunteer,
      status: UserStatus.unverified,
    });

    const updated = normalizeAuthUserUpdateInput({
      email: "  Changed@Example.COM ",
      role: Role.instructor,
    });
    expect(updated.data).toEqual({
      email: "changed@example.com",
      role: Role.instructor,
    });

    expect(() =>
      normalizeAuthUserCreateInput({
        email: "a@b.com",
        role: "invalid-role",
      }),
    ).toThrow(/Invalid user role/);

    expect(() =>
      normalizeAuthUserUpdateInput({
        status: "invalid-status",
      }),
    ).toThrow(/Invalid user status/);
  });

  it("detects Postgres unique violation errors directly and via cause chain", () => {
    expect(isUniqueViolation({ code: "23505" })).toBe(true);
    expect(
      isUniqueViolation({
        message: "Failed query",
        cause: { code: "23505" },
      }),
    ).toBe(true);
    expect(
      isUniqueViolation({
        cause: { cause: { code: "23505" } },
      }),
    ).toBe(true);
    expect(isUniqueViolation({ code: "23503" })).toBe(false);
    expect(isUniqueViolation(new Error("other"))).toBe(false);
  });
});
