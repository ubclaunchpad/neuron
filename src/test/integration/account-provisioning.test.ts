import { isUniqueViolation } from "@/server/db/errors";
import { randomUUID } from "crypto";
import { readFileSync } from "fs";
import path from "path";
import { eq, inArray, sql } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Role, UserStatus } from "@/models/interfaces";
import { appInvitation, user, volunteer } from "@/server/db/schema";
import { NeuronError, NeuronErrorCodes } from "@/server/errors/neuron-error";
import {
  accountAdapter,
  provisionUser,
} from "@/server/services/entity/accountProvisioning";
import type { IUserService } from "@/server/services/entity/userService";
import type { IVolunteerService } from "@/server/services/entity/volunteerService";
import {
  createTestScope,
  type ITestServiceScope,
} from "../helpers/test-service-scope";

const { jobRunMock, emailSendMock } = vi.hoisted(() => ({
  jobRunMock: vi.fn(async () => "mock-job-id"),
  emailSendMock: vi.fn(async () => undefined),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/server/api/di-container", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/server/api/di-container")>();
  return {
    ...actual,
    createRequestScope: () => ({
      cradle: {
        jobService: { run: jobRunMock },
        emailService: { send: emailSendMock },
      },
    }),
  };
});

import { auth } from "@/lib/auth";

describe("Account provisioning and normalized identity invariants", () => {
  let scope: ITestServiceScope;
  let userService: IUserService;
  let volunteerService: IVolunteerService;
  let createdUserIds: string[] = [];

  function uniqueEmail(prefix: string, domain = "Example.COM") {
    return `${prefix}-${Date.now()}-${randomUUID().slice(0, 8)}@${domain}`;
  }

  beforeEach(() => {
    jobRunMock.mockClear();
    emailSendMock.mockClear();
    scope = createTestScope();
    scope.mockSession.setAsAdmin();
    userService = scope.resolve<IUserService>("userService");
    volunteerService = scope.resolve<IVolunteerService>("volunteerService");
  });

  afterEach(async () => {
    if (createdUserIds.length > 0) {
      await scope.db.delete(user).where(inArray(user.id, createdUserIds));
      createdUserIds = [];
    }
    scope.dispose();
  });

  describe("direct user creation (UserService.createUser)", () => {
    it("normalizes email and creates admin/instructor without a volunteer profile", async () => {
      const rawAdminEmail = `  Admin.User.${uniqueEmail("Direct")}  `;
      const admin = await userService.createUser({
        name: "Ada",
        lastName: "Admin",
        email: rawAdminEmail,
        role: Role.admin,
      });
      createdUserIds.push(admin.id);

      expect(admin.email).toBe(rawAdminEmail.trim().toLowerCase());
      expect(admin.role).toBe(Role.admin);
      expect(admin.status).toBe(UserStatus.active);

      const adminProfiles = await scope.db
        .select()
        .from(volunteer)
        .where(eq(volunteer.userId, admin.id));
      expect(adminProfiles).toHaveLength(0);

      const rawInstructorEmail = `  Inst.User.${uniqueEmail("Direct")} `;
      const instructor = await userService.createUser({
        name: "Grace",
        lastName: "Instructor",
        email: rawInstructorEmail,
        role: Role.instructor,
      });
      createdUserIds.push(instructor.id);

      expect(instructor.email).toBe(rawInstructorEmail.trim().toLowerCase());
      expect(instructor.role).toBe(Role.instructor);
      expect(instructor.status).toBe(UserStatus.active);

      const instructorProfiles = await scope.db
        .select()
        .from(volunteer)
        .where(eq(volunteer.userId, instructor.id));
      expect(instructorProfiles).toHaveLength(0);
    });

    it("rejects volunteer role in direct creation without persisting a malformed user", async () => {
      const email = uniqueEmail("DirectVol").toLowerCase();

      await expect(
        userService.createUser({
          name: "Vol",
          lastName: "Direct",
          email,
          role: Role.volunteer as unknown as "admin",
        }),
      ).rejects.toMatchObject({
        code: NeuronErrorCodes.BAD_REQUEST,
      });

      const rows = await scope.db
        .select()
        .from(user)
        .where(eq(user.email, email));
      expect(rows).toHaveLength(0);
    });

    it("rejects duplicate mixed-case and whitespace-padded emails", async () => {
      const baseEmail = uniqueEmail("CaseCollision", "example.com");
      const first = await userService.createUser({
        name: "First",
        lastName: "Admin",
        email: `\t${baseEmail.toUpperCase()}\n`,
        role: Role.admin,
      });
      createdUserIds.push(first.id);

      await expect(
        userService.createUser({
          name: "Second",
          lastName: "Instructor",
          email: `  ${baseEmail.toLowerCase()}  `,
          role: Role.instructor,
        }),
      ).rejects.toSatisfy(
        (err: unknown) =>
          err instanceof NeuronError &&
          err.code === NeuronErrorCodes.BAD_REQUEST,
      );
    });
  });

  describe("instructor creation and updates (UserService)", () => {
    it("normalizes email on createInstructor and rejects case-colliding duplicates", async () => {
      const rawEmail = `  Mixed.Inst.${uniqueEmail("Create")} `;
      const created = await userService.createInstructor({
        firstName: "Alan",
        lastName: "Turing",
        email: rawEmail,
      });
      createdUserIds.push(created.id);

      expect(created.email).toBe(rawEmail.trim().toLowerCase());
      expect(created.role).toBe(Role.instructor);
      expect(created.status).toBe(UserStatus.active);

      const profiles = await scope.db
        .select()
        .from(volunteer)
        .where(eq(volunteer.userId, created.id));
      expect(profiles).toHaveLength(0);

      await expect(
        userService.createInstructor({
          firstName: "Alan",
          lastName: "Duplicate",
          email: created.email.toUpperCase(),
        }),
      ).rejects.toMatchObject({
        code: NeuronErrorCodes.BAD_REQUEST,
      });
    });

    it("normalizes email on updateInstructor and enforces case-insensitive uniqueness", async () => {
      const instA = await userService.createInstructor({
        firstName: "Inst",
        lastName: "Alpha",
        email: uniqueEmail("InstA"),
      });
      const instB = await userService.createInstructor({
        firstName: "Inst",
        lastName: "Beta",
        email: uniqueEmail("InstB"),
      });
      createdUserIds.push(instA.id, instB.id);

      // Updating own email with different case succeeds and stays normalized.
      const selfUpdated = await userService.updateInstructor({
        instructorId: instA.id,
        email: `  ${instA.email.toUpperCase()}  `,
      });
      expect(selfUpdated.email).toBe(instA.email);

      // Updating to a new mixed-case email normalizes it.
      const nextRawEmail = `  Updated.${uniqueEmail("InstA")} `;
      const renamed = await userService.updateInstructor({
        instructorId: instA.id,
        email: nextRawEmail,
      });
      expect(renamed.email).toBe(nextRawEmail.trim().toLowerCase());

      // Updating to another user's email in uppercase is rejected.
      await expect(
        userService.updateInstructor({
          instructorId: instA.id,
          email: `  ${instB.email.toUpperCase()} `,
        }),
      ).rejects.toMatchObject({
        code: NeuronErrorCodes.BAD_REQUEST,
      });
    });
  });

  describe("shared atomic volunteer provisioning", () => {
    it("atomically creates user and required volunteer profile in one transaction", async () => {
      const rawEmail = `  Atomic.Vol.${uniqueEmail("Provision")} `;
      const created = await provisionUser(scope.db, {
        name: "Val",
        lastName: "Volunteer",
        email: rawEmail,
        role: Role.volunteer,
        status: UserStatus.unverified,
        emailVerified: false,
      });
      createdUserIds.push(created.id);

      expect(created.email).toBe(rawEmail.trim().toLowerCase());
      expect(created.role).toBe(Role.volunteer);
      expect(created.status).toBe(UserStatus.unverified);

      const hydrated = await volunteerService.getVolunteer(created.id);
      expect(hydrated.id).toBe(created.id);
      expect(hydrated.email).toBe(rawEmail.trim().toLowerCase());
    });

    it("rolls back the auth user when profile insertion fails", async () => {
      const email = uniqueEmail("AtomicAuth").toLowerCase();
      // Force the actual profile INSERT to fail within the adapter transaction.
      await expect(
        scope.db.transaction(async (tx) => {
          const adapter = accountAdapter(tx)({
            advanced: { database: { generateId: false } },
            user: {
              additionalFields: {
                role: { type: "string" },
                lastName: { type: "string" },
              },
            },
          });
          await tx.execute(sql`CREATE FUNCTION pg_temp.reject_profile() RETURNS trigger LANGUAGE plpgsql AS $$
          BEGIN RAISE EXCEPTION 'profile insert failed'; END $$`);
          await tx.execute(sql`CREATE TRIGGER reject_profile BEFORE INSERT ON volunteer
          FOR EACH ROW EXECUTE FUNCTION pg_temp.reject_profile()`);
          await adapter.create({
            model: "user",
            data: {
              name: "Broken",
              lastName: "Profile",
              email,
              role: Role.volunteer,
            },
          });
        }),
      ).rejects.toMatchObject({ cause: { message: "profile insert failed" } });
      expect(
        await scope.db.select().from(user).where(eq(user.email, email)),
      ).toHaveLength(0);
    });
  });

  describe("Better Auth signup, signin, and app-invite provisioning", () => {
    it("self-signup normalizes email, creates volunteer profile, and blocks mixed-case duplicates", async () => {
      const rawEmail = `  Self.Signup.${uniqueEmail("Vol")}  `;
      const normalized = rawEmail.trim().toLowerCase();

      const signupRes = await auth.api.signUpEmail({
        body: {
          name: "Self",
          lastName: "Volunteer",
          email: rawEmail,
          password: "StrongPassword123!",
        },
      });
      createdUserIds.push(signupRes.user.id);

      expect(signupRes.user.email).toBe(normalized);
      expect(signupRes.user.role).toBe(Role.volunteer);
      expect(signupRes.user.status).toBe(UserStatus.unverified);
      expect(signupRes.user.emailVerified).toBe(false);

      // Volunteer profile row exists and is visible through vw_volunteer_user.
      const hydratedVolunteer = await volunteerService.getVolunteer(
        signupRes.user.id,
      );
      expect(hydratedVolunteer.id).toBe(signupRes.user.id);
      expect(hydratedVolunteer.email).toBe(normalized);

      // Better Auth masks existing identities with a synthetic response.
      await auth.api.signUpEmail({
        body: {
          name: "Dup",
          lastName: "Volunteer",
          email: normalized.toUpperCase(),
          password: "StrongPassword123!",
        },
      });
      const identities = await scope.db
        .select()
        .from(user)
        .where(eq(user.email, normalized));
      expect(identities).toHaveLength(1);
      expect(identities[0]?.id).toBe(signupRes.user.id);

      // Mark email verified and confirm mixed-case sign-in resolves the same user.
      await scope.db
        .update(user)
        .set({ emailVerified: true })
        .where(eq(user.id, signupRes.user.id));

      const signInRes = await auth.api.signInEmail({
        body: {
          email: `  ${normalized.toUpperCase()}  `,
          password: "StrongPassword123!",
        },
      });
      expect(signInRes.user.id).toBe(signupRes.user.id);
      expect(signInRes.user.email).toBe(normalized);
    });

    it("blocks signup when an instructor with different email casing already exists", async () => {
      const rawEmail = `Existing.Inst.${uniqueEmail("CrossPath")}`;
      const instructor = await userService.createInstructor({
        firstName: "Existing",
        lastName: "Instructor",
        email: rawEmail,
      });
      createdUserIds.push(instructor.id);

      await auth.api.signUpEmail({
        body: {
          name: "Clash",
          lastName: "Volunteer",
          email: rawEmail.toUpperCase(),
          password: "StrongPassword123!",
        },
      });
      const identities = await scope.db
        .select()
        .from(user)
        .where(eq(user.email, instructor.email));
      expect(identities).toHaveLength(1);
      expect(identities[0]?.id).toBe(instructor.id);
      expect(identities[0]?.role).toBe(Role.instructor);
    });

    it("normalizes invite emails and enforces role/profile/status invariants on accept for admin, instructor, and volunteer", async () => {
      // Create an authenticated admin inviter with a live session cookie.
      const inviterEmail = uniqueEmail("Inviter").toLowerCase();
      const inviterSignup = await auth.api.signUpEmail({
        body: {
          name: "Root",
          lastName: "Admin",
          email: inviterEmail,
          password: "StrongPassword123!",
        },
      });
      createdUserIds.push(inviterSignup.user.id);

      await scope.db
        .update(user)
        .set({
          role: Role.admin,
          status: UserStatus.active,
          emailVerified: true,
        })
        .where(eq(user.id, inviterSignup.user.id));
      await scope.db
        .delete(volunteer)
        .where(eq(volunteer.userId, inviterSignup.user.id));

      const inviterLogin = await auth.api.signInEmail({
        body: {
          email: inviterEmail,
          password: "StrongPassword123!",
        },
        returnHeaders: true,
      });
      const setCookie = inviterLogin.headers.get("set-cookie");
      expect(setCookie).toBeTruthy();
      const inviterHeaders = new Headers({
        cookie: setCookie!.split(";")[0]!,
      });

      // 1. Invite admin with mixed-case/whitespace email -> stored normalized, duplicate case blocked.
      const rawAdminInviteEmail = `  Invited.Admin.${uniqueEmail("Inv")}  `;
      const normalizedAdminInviteEmail = rawAdminInviteEmail
        .trim()
        .toLowerCase();

      const adminInvite = await auth.api.createAppInvitation({
        headers: inviterHeaders,
        body: {
          type: "personal",
          email: rawAdminInviteEmail,
          additionalFields: {
            role: Role.admin,
          },
        },
      });
      expect(adminInvite.email).toBe(normalizedAdminInviteEmail);

      await expect(
        auth.api.createAppInvitation({
          headers: inviterHeaders,
          body: {
            type: "personal",
            email: normalizedAdminInviteEmail.toUpperCase(),
            additionalFields: {
              role: Role.admin,
            },
          },
        }),
      ).rejects.toThrow();

      // Accept admin invitation -> role=admin, status=active, no stray volunteer row.
      const acceptedAdmin = await auth.api.acceptAppInvitation({
        body: {
          invitationId: adminInvite.id,
          name: "Invited",
          password: "StrongPassword123!",
          additionalFields: {
            lastName: "Admin",
          },
        },
      });
      createdUserIds.push(acceptedAdmin.user.id);

      const [dbAdmin] = await scope.db
        .select()
        .from(user)
        .where(eq(user.id, acceptedAdmin.user.id));
      expect(dbAdmin?.email).toBe(normalizedAdminInviteEmail);
      expect(dbAdmin?.role).toBe(Role.admin);
      expect(dbAdmin?.status).toBe(UserStatus.active);
      expect(dbAdmin?.emailVerified).toBe(true);

      const adminVolRows = await scope.db
        .select()
        .from(volunteer)
        .where(eq(volunteer.userId, acceptedAdmin.user.id));
      expect(adminVolRows).toHaveLength(0);

      // 2. Invite & accept instructor -> role=instructor, status=active, no stray volunteer row.
      const rawInstInviteEmail = `  Invited.Inst.${uniqueEmail("Inv")} `;
      const instInvite = await auth.api.createAppInvitation({
        headers: inviterHeaders,
        body: {
          type: "personal",
          email: rawInstInviteEmail,
          additionalFields: {
            role: Role.instructor,
          },
        },
      });
      const acceptedInst = await auth.api.acceptAppInvitation({
        body: {
          invitationId: instInvite.id,
          name: "Invited",
          password: "StrongPassword123!",
          additionalFields: {
            lastName: "Instructor",
          },
        },
      });
      createdUserIds.push(acceptedInst.user.id);

      const [dbInst] = await scope.db
        .select()
        .from(user)
        .where(eq(user.id, acceptedInst.user.id));
      expect(dbInst?.email).toBe(rawInstInviteEmail.trim().toLowerCase());
      expect(dbInst?.role).toBe(Role.instructor);
      expect(dbInst?.status).toBe(UserStatus.active);
      const instVolRows = await scope.db
        .select()
        .from(volunteer)
        .where(eq(volunteer.userId, acceptedInst.user.id));
      expect(instVolRows).toHaveLength(0);

      // 3. Invite & accept volunteer -> role=volunteer, status=active, volunteer profile present.
      const rawVolInviteEmail = `  Invited.Vol.${uniqueEmail("Inv")} `;
      const volInvite = await auth.api.createAppInvitation({
        headers: inviterHeaders,
        body: {
          type: "personal",
          email: rawVolInviteEmail,
          additionalFields: {
            role: Role.volunteer,
          },
        },
      });
      const acceptedVol = await auth.api.acceptAppInvitation({
        body: {
          invitationId: volInvite.id,
          name: "Invited",
          password: "StrongPassword123!",
          additionalFields: {
            lastName: "Volunteer",
          },
        },
      });
      createdUserIds.push(acceptedVol.user.id);

      const hydratedVol = await volunteerService.getVolunteer(
        acceptedVol.user.id,
      );
      expect(hydratedVol.email).toBe(rawVolInviteEmail.trim().toLowerCase());
      expect(hydratedVol.role).toBe(Role.volunteer);
      expect(hydratedVol.status).toBe(UserStatus.active);
    });
  });

  describe("Postgres normalized uniqueness and migration 0012 guard/reconciliation", () => {
    it("enforces normalized email uniqueness directly in Postgres even for raw SQL writes", async () => {
      const rawEmail = `Raw.Unique.${uniqueEmail("PgIndex")}`;
      const [first] = await scope.db
        .insert(user)
        .values({
          name: "Raw",
          lastName: "First",
          email: rawEmail,
          role: Role.instructor,
          status: UserStatus.active,
          emailVerified: false,
        })
        .returning();
      createdUserIds.push(first!.id);

      let caught: unknown;
      try {
        await scope.db.insert(user).values({
          name: "Raw",
          lastName: "Second",
          email: `\t${rawEmail.toLowerCase()}\n`,
          role: Role.instructor,
          status: UserStatus.active,
          emailVerified: false,
        });
      } catch (err) {
        caught = err;
      }

      expect(isUniqueViolation(caught)).toBe(true);
    });

    it("migration 0012 aborts with an actionable error when case-colliding emails exist", async () => {
      const migrationSql = readFileSync(
        path.resolve(
          process.cwd(),
          "src/server/db/migrations/0012_normalize_user_email_and_volunteer_profiles.sql",
        ),
        "utf8",
      );
      const statements = migrationSql
        .split("--> statement-breakpoint")
        .map((s) => s.trim())
        .filter(Boolean);

      const rollbackSentinel = new Error("ROLLBACK_TEST_TX");
      const baseEmail = uniqueEmail("MigCollision", "example.com");

      await expect(
        scope.db.transaction(async (tx) => {
          await tx.execute(
            sql`DROP INDEX IF EXISTS "uq_user_email_normalized"`,
          );

          await tx.insert(user).values([
            {
              name: "Collide",
              lastName: "One",
              email: baseEmail.toLowerCase(),
              role: Role.instructor,
              status: UserStatus.active,
              emailVerified: false,
            },
            {
              name: "Collide",
              lastName: "Two",
              email: `\t${baseEmail.toUpperCase()}\n`,
              role: Role.instructor,
              status: UserStatus.active,
              emailVerified: false,
            },
          ]);

          await expect(tx.execute(sql.raw(statements[0]!))).rejects.toSatisfy(
            (err: unknown) => {
              const message =
                err instanceof Error
                  ? `${err.message} ${String((err as { cause?: Error }).cause?.message ?? "")}`
                  : String(err);
              return (
                message.includes("case/whitespace-colliding email group(s)") &&
                message.includes("select a verified owner")
              );
            },
          );

          throw rollbackSentinel;
        }),
      ).rejects.toThrow("ROLLBACK_TEST_TX");
    });

    it("migration 0012 normalizes non-colliding emails, backfills missing volunteer profiles, and installs uq_user_email_normalized", async () => {
      const migrationSql = readFileSync(
        path.resolve(
          process.cwd(),
          "src/server/db/migrations/0012_normalize_user_email_and_volunteer_profiles.sql",
        ),
        "utf8",
      );
      const statements = migrationSql
        .split("--> statement-breakpoint")
        .map((s) => s.trim())
        .filter(Boolean);

      const rollbackSentinel = new Error("ROLLBACK_TEST_TX");
      const rawVolunteerEmail = `\tLegacy.Vol.${uniqueEmail("MigHeal")}\n`;
      const rawInviteEmail = `  Legacy.Inv.${uniqueEmail("MigHeal")} `;

      await expect(
        scope.db.transaction(async (tx) => {
          await tx.execute(
            sql`DROP INDEX IF EXISTS "uq_user_email_normalized"`,
          );

          // Simulate pre-migration malformed volunteer (no volunteer profile row) + mixed-case email.
          const [legacyVol] = await tx
            .insert(user)
            .values({
              name: "Legacy",
              lastName: "Volunteer",
              email: rawVolunteerEmail,
              role: Role.volunteer,
              status: UserStatus.active,
              emailVerified: false,
            })
            .returning();

          const [legacyInvite] = await tx
            .insert(appInvitation)
            .values({
              email: rawInviteEmail,
              status: "pending",
              inviterId: legacyVol!.id,
              role: Role.instructor,
            })
            .returning();

          for (const statement of statements) {
            await tx.execute(sql.raw(statement));
          }

          const [healedUser] = await tx
            .select()
            .from(user)
            .where(eq(user.id, legacyVol!.id));
          expect(healedUser?.email).toBe(
            rawVolunteerEmail.trim().toLowerCase(),
          );

          const [healedProfile] = await tx
            .select()
            .from(volunteer)
            .where(eq(volunteer.userId, legacyVol!.id));
          expect(healedProfile?.userId).toBe(legacyVol!.id);

          const [healedInvite] = await tx
            .select()
            .from(appInvitation)
            .where(eq(appInvitation.id, legacyInvite!.id));
          expect(healedInvite?.email).toBe(rawInviteEmail.trim().toLowerCase());

          throw rollbackSentinel;
        }),
      ).rejects.toThrow("ROLLBACK_TEST_TX");
    });
  });
});
