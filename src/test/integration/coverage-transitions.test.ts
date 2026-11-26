import { describe, it, expect, afterAll, afterEach, beforeEach } from "vitest";
import { randomUUID } from "crypto";
import { Temporal } from "@js-temporal/polyfill";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, inArray } from "drizzle-orm";
import { env } from "@/env";
import * as schema from "@/server/db/schema";
import {
  course,
  coverageRequest,
  shift,
  shiftAttendance,
  term,
  user,
  volunteer,
} from "@/server/db/schema";
import { CoverageStatus } from "@/models/api/coverage";
import type { SingleShiftWithRosterContext } from "@/models/shift";
import {
  CoverageService,
  type ICoverageService,
} from "@/server/services/entity/coverageService";
import {
  ShiftService,
  type IShiftService,
} from "@/server/services/entity/shiftService";
import type { IClassService } from "@/server/services/entity/classService";
import type { ITermService } from "@/server/services/entity/termService";
import { VolunteerService } from "@/server/services/entity/volunteerService";
import { getEffectiveVolunteerAssignmentsForShifts } from "@/server/services/entity/shiftAssignment";
import {
  createTestScope,
  type ITestServiceScope,
} from "../helpers/test-service-scope";
import { MockCurrentSessionService } from "../mocks/mock-current-session-service";
import { MockJobService } from "../mocks/mock-job-service";
import { MockNotificationEventService } from "../mocks/mock-notification-services";

describe("Coverage transitions, concurrency, and canceled-shift guards", () => {
  // Use a dedicated multi-connection pool so Promise.all tests execute true
  // concurrent PostgreSQL transactions contending on row locks (getTestDb uses
  // max: 1, which would serialize queries on the client side).
  const concurrentConn = postgres(env.DATABASE_URL, {
    max: 10,
    onnotice: () => {},
  });
  const concurrentDb = drizzle(concurrentConn, { schema });

  let scope: ITestServiceScope;
  let termService: ITermService;
  let classService: IClassService;
  let shiftService: IShiftService;
  let coverageService: ICoverageService;

  let createdUserIds: string[] = [];
  let createdTermIds: string[] = [];
  let createdClassIds: string[] = [];

  const today = Temporal.Now.plainDateISO();
  const futureDate = today.add({ days: 20 }).toString();
  const termStartDate = today.subtract({ days: 30 }).toString();
  const termEndDate = today.add({ days: 90 }).toString();

  function createConcurrentServices(actor?: {
    id: string;
    role: "admin" | "volunteer";
    name?: string;
    lastName?: string;
  }) {
    const mockSession = new MockCurrentSessionService();
    if (actor?.role === "volunteer") {
      mockSession.setAsVolunteer({
        id: actor.id,
        name: actor.name ?? "Vol",
        lastName: actor.lastName ?? "Tester",
      });
    } else {
      mockSession.setAsAdmin(actor ? { id: actor.id } : undefined);
    }

    const notificationEventService = new MockNotificationEventService();
    const jobService = new MockJobService();
    const volunteerService = new VolunteerService({ db: concurrentDb });
    const concurrentShiftService = new ShiftService({
      db: concurrentDb,
      currentSessionService: mockSession,
      notificationEventService,
      jobService,
    });
    const concurrentCoverageService = new CoverageService({
      db: concurrentDb,
      currentSessionService: mockSession,
      volunteerService,
      shiftService: concurrentShiftService,
      notificationEventService,
    });

    return {
      shiftService: concurrentShiftService,
      coverageService: concurrentCoverageService,
      notificationEventService,
      mockSession,
    };
  }

  async function createTestUser(
    role: "volunteer" | "instructor" | "admin",
    name: string,
    lastName = "Tester",
  ): Promise<string> {
    const id = randomUUID();
    await scope.db.insert(user).values({
      id,
      name,
      lastName,
      email: `${name.toLowerCase()}-${Date.now()}-${randomUUID()}@test.com`,
      role,
      status: "active",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    createdUserIds.push(id);

    if (role === "volunteer") {
      await scope.db.insert(volunteer).values({ userId: id });
    }

    return id;
  }

  async function createFutureShift(opts: {
    volunteerUserIds: string[];
    instructorUserId: string;
    date?: string;
  }): Promise<{ termId: string; classId: string; shiftId: string }> {
    const termId = await termService.createTerm({
      name: `Term ${randomUUID()}`,
      startDate: termStartDate,
      endDate: termEndDate,
      holidays: [],
    });
    createdTermIds.push(termId);
    await termService.publishTerm(termId);

    const classId = await classService.createClass({
      termId,
      name: `Class ${randomUUID()}`,
      lowerLevel: 1,
      upperLevel: 2,
      category: "literacy",
      schedules: [
        {
          localStartTime: Temporal.PlainTime.from("10:00:00"),
          localEndTime: Temporal.PlainTime.from("11:00:00"),
          volunteerUserIds: opts.volunteerUserIds,
          preferredVolunteerCount: Math.max(opts.volunteerUserIds.length, 1),
          instructorUserIds: [opts.instructorUserId],
          rule: {
            type: "single",
            extraDates: [opts.date ?? futureDate],
          },
        },
      ],
    });
    createdClassIds.push(classId);
    await classService.publishClass(classId);

    const [shiftRow] = await scope.db
      .select({ id: shift.id })
      .from(shift)
      .where(eq(shift.courseId, classId))
      .limit(1);

    return { termId, classId, shiftId: shiftRow!.id };
  }

  beforeEach(() => {
    scope = createTestScope();
    scope.mockSession.setAsAdmin();
    termService = scope.resolve<ITermService>("termService");
    classService = scope.resolve<IClassService>("classService");
    shiftService = scope.resolve<IShiftService>("shiftService");
    coverageService = scope.resolve<ICoverageService>("coverageService");
  });

  afterEach(async () => {
    if (createdClassIds.length > 0) {
      await scope.db.delete(course).where(inArray(course.id, createdClassIds));
      createdClassIds = [];
    }
    if (createdTermIds.length > 0) {
      await scope.db.delete(term).where(inArray(term.id, createdTermIds));
      createdTermIds = [];
    }
    if (createdUserIds.length > 0) {
      await scope.db.delete(user).where(inArray(user.id, createdUserIds));
      createdUserIds = [];
    }
    scope.dispose();
  });

  afterAll(async () => {
    await concurrentConn.end();
  });

  describe("A -> B -> withdrawal -> C original absence preservation", () => {
    it("preserves the original requester across coverer unassignment and replacement", async () => {
      const volA = await createTestUser("volunteer", "Alice");
      const volB = await createTestUser("volunteer", "Bob");
      const volC = await createTestUser("volunteer", "Carol");
      const volD = await createTestUser("volunteer", "Dan");
      const adminId = await createTestUser("admin", "Admin");
      const instructorId = await createTestUser("instructor", "Inst");
      scope.mockSession.setAsAdmin({ id: adminId });

      const { shiftId } = await createFutureShift({
        volunteerUserIds: [volA, volD],
        instructorUserId: instructorId,
      });

      // Step 1: A requests coverage.
      const requestId = await coverageService.createCoverageRequest(volA, {
        shiftId,
        category: "health",
        details: "Out sick",
      });

      // Step 2: B fulfills A's coverage request.
      await coverageService.fulfillCoverageRequest(volB, requestId);

      const rosterAfterB = (await shiftService.getShiftById(
        shiftId,
        adminId,
      )) as SingleShiftWithRosterContext;
      expect(rosterAfterB.volunteers.map((v) => v.id).sort()).toEqual(
        [volB, volD].sort(),
      );
      expect(
        rosterAfterB.volunteers.find((v) => v.id === volB)?.coveringFor?.id,
      ).toBe(volA);

      // Step 3: B unassigns coverage. Original requester A MUST survive!
      await coverageService.unassignCoverage(volB, requestId);

      const [reopened] = await scope.db
        .select()
        .from(coverageRequest)
        .where(eq(coverageRequest.id, requestId));
      expect(reopened!.status).toBe(CoverageStatus.open);
      expect(reopened!.requestingVolunteerUserId).toBe(volA);
      expect(reopened!.coveredByVolunteerUserId).toBeNull();

      const rosterAfterUnassign = (await shiftService.getShiftById(
        shiftId,
        adminId,
      )) as SingleShiftWithRosterContext;
      expect(rosterAfterUnassign.volunteers.map((v) => v.id).sort()).toEqual(
        [volA, volD].sort(),
      );

      // Step 4: C fulfills the reopened coverage request.
      await coverageService.fulfillCoverageRequest(volC, requestId);

      const [finalReq] = await scope.db
        .select()
        .from(coverageRequest)
        .where(eq(coverageRequest.id, requestId));
      expect(finalReq!.status).toBe(CoverageStatus.resolved);
      expect(finalReq!.requestingVolunteerUserId).toBe(volA);
      expect(finalReq!.coveredByVolunteerUserId).toBe(volC);

      // Effective roster must be [C (coveringFor: A), D] — NEVER [A, C, D]!
      const finalShift = (await shiftService.getShiftById(
        shiftId,
        adminId,
      )) as SingleShiftWithRosterContext;
      expect(finalShift.volunteers.map((v) => v.id).sort()).toEqual(
        [volC, volD].sort(),
      );
      expect(finalShift.volunteers.some((v) => v.id === volA)).toBe(false);
      expect(finalShift.volunteers.some((v) => v.id === volB)).toBe(false);
      expect(
        finalShift.volunteers.find((v) => v.id === volC)?.coveringFor?.id,
      ).toBe(volA);

      const effectiveMap = await getEffectiveVolunteerAssignmentsForShifts(
        scope.db,
        [shiftId],
      );
      const effectiveIds = (effectiveMap.get(shiftId) ?? [])
        .map((a) => a.volunteerUserId)
        .sort();
      expect(effectiveIds).toEqual([volC, volD].sort());

      // Check-in must reflect the exact resulting roster: C allowed, A & B rejected.
      scope.mockSession.setAsAdmin({ id: adminId });
      await expect(shiftService.checkIn(shiftId, volA)).rejects.toThrow(
        "Volunteer is not assigned to this shift",
      );
      await expect(shiftService.checkIn(shiftId, volB)).rejects.toThrow(
        "Volunteer is not assigned to this shift",
      );
      const checkInResult = await shiftService.checkIn(shiftId, volC);
      expect(checkInResult.volunteerUserId).toBe(volC);
    });

    it("allows the original requester to withdraw their request after a coverer unassigns", async () => {
      const volA = await createTestUser("volunteer", "Alice");
      const volB = await createTestUser("volunteer", "Bob");
      const instructorId = await createTestUser("instructor", "Inst");

      const { shiftId } = await createFutureShift({
        volunteerUserIds: [volA],
        instructorUserId: instructorId,
      });

      const requestId = await coverageService.createCoverageRequest(volA, {
        shiftId,
        category: "conflict",
        details: "Conflict",
      });
      await coverageService.fulfillCoverageRequest(volB, requestId);
      await coverageService.unassignCoverage(volB, requestId);

      // A still owns the open coverage request and can cancel/withdraw it.
      await coverageService.cancelCoverageRequest(volA, requestId);

      const [reqRow] = await scope.db
        .select()
        .from(coverageRequest)
        .where(eq(coverageRequest.id, requestId));
      expect(reqRow!.status).toBe(CoverageStatus.withdrawn);
      expect(reqRow!.requestingVolunteerUserId).toBe(volA);
      expect(reqRow!.coveredByVolunteerUserId).toBeNull();
    });

    it("rejects unassigning coverage if the coverer already transferred their slot onward", async () => {
      const volA = await createTestUser("volunteer", "Alice");
      const volB = await createTestUser("volunteer", "Bob");
      const volC = await createTestUser("volunteer", "Carol");
      const instructorId = await createTestUser("instructor", "Inst");

      const { shiftId } = await createFutureShift({
        volunteerUserIds: [volA],
        instructorUserId: instructorId,
      });

      const reqA = await coverageService.createCoverageRequest(volA, {
        shiftId,
        category: "health",
        details: "A out",
      });
      await coverageService.fulfillCoverageRequest(volB, reqA);

      const reqB = await coverageService.createCoverageRequest(volB, {
        shiftId,
        category: "emergency",
        details: "B out",
      });
      await coverageService.fulfillCoverageRequest(volC, reqB);

      // B is no longer effectively assigned (C holds the slot), so B cannot
      // unassign reqA (which would otherwise put both A and C on the roster).
      await expect(
        coverageService.unassignCoverage(volB, reqA),
      ).rejects.toThrow(/already been transferred/i);

      const effective =
        (
          await getEffectiveVolunteerAssignmentsForShifts(scope.db, [shiftId])
        ).get(shiftId) ?? [];
      expect(effective.map((a) => a.volunteerUserId)).toEqual([volC]);
    });

    it("withdraws an outgoing open request from a coverer who unassigns so it cannot create an extra slot", async () => {
      const volA = await createTestUser("volunteer", "Alice");
      const volB = await createTestUser("volunteer", "Bob");
      const volC = await createTestUser("volunteer", "Carol");
      const instructorId = await createTestUser("instructor", "Inst");

      const { shiftId } = await createFutureShift({
        volunteerUserIds: [volA],
        instructorUserId: instructorId,
      });

      const reqA = await coverageService.createCoverageRequest(volA, {
        shiftId,
        category: "health",
        details: "A out",
      });
      await coverageService.fulfillCoverageRequest(volB, reqA);

      const reqB = await coverageService.createCoverageRequest(volB, {
        shiftId,
        category: "conflict",
        details: "B might need coverage",
      });

      await coverageService.unassignCoverage(volB, reqA);

      const [reqBRow] = await scope.db
        .select()
        .from(coverageRequest)
        .where(eq(coverageRequest.id, reqB));
      expect(reqBRow!.status).toBe(CoverageStatus.withdrawn);

      // C cannot claim B's now-withdrawn request.
      await expect(
        coverageService.fulfillCoverageRequest(volC, reqB),
      ).rejects.toThrow("Coverage request is not open.");
    });
  });

  describe("Concurrency and per-shift serialization", () => {
    it("allows exactly one competing claimant to fulfill an open coverage request", async () => {
      const volA = await createTestUser("volunteer", "Alice");
      const claimants = await Promise.all([
        createTestUser("volunteer", "Claimant1"),
        createTestUser("volunteer", "Claimant2"),
        createTestUser("volunteer", "Claimant3"),
        createTestUser("volunteer", "Claimant4"),
        createTestUser("volunteer", "Claimant5"),
      ]);
      const instructorId = await createTestUser("instructor", "Inst");

      const { shiftId } = await createFutureShift({
        volunteerUserIds: [volA],
        instructorUserId: instructorId,
      });

      const requestId = await coverageService.createCoverageRequest(volA, {
        shiftId,
        category: "emergency",
        details: "Need urgent cover",
      });

      const runners = claimants.map((id, idx) => ({
        id,
        svc: createConcurrentServices({
          id,
          role: "volunteer",
          name: `Claimant${idx + 1}`,
        }),
      }));

      const outcomes = await Promise.allSettled(
        runners.map((r) =>
          r.svc.coverageService.fulfillCoverageRequest(r.id, requestId),
        ),
      );

      const successes = outcomes
        .map((res, idx) => ({ res, runner: runners[idx]! }))
        .filter((x) => x.res.status === "fulfilled");
      const failures = outcomes.filter((res) => res.status === "rejected");

      expect(successes).toHaveLength(1);
      expect(failures).toHaveLength(claimants.length - 1);

      const winnerId = successes[0]!.runner.id;

      const [reqRow] = await scope.db
        .select()
        .from(coverageRequest)
        .where(eq(coverageRequest.id, requestId));
      expect(reqRow!.status).toBe(CoverageStatus.resolved);
      expect(reqRow!.requestingVolunteerUserId).toBe(volA);
      expect(reqRow!.coveredByVolunteerUserId).toBe(winnerId);

      // Exactly one notification emitted, and only for the winning claimant.
      const filledCalls = runners.flatMap((r) =>
        r.svc.notificationEventService.calls.filter(
          (c) => c.method === "notifyCoverageFilled",
        ),
      );
      expect(filledCalls).toHaveLength(1);
      expect(
        (filledCalls[0]!.params as { coveredByVolunteerUserId: string })
          .coveredByVolunteerUserId,
      ).toBe(winnerId);

      const effective =
        (
          await getEffectiveVolunteerAssignmentsForShifts(scope.db, [shiftId])
        ).get(shiftId) ?? [];
      expect(effective.map((a) => a.volunteerUserId)).toEqual([winnerId]);
    });

    it("prevents a single volunteer from claiming multiple coverage slots on the same shift concurrently", async () => {
      const volA = await createTestUser("volunteer", "Alice");
      const volB = await createTestUser("volunteer", "Bob");
      const volC = await createTestUser("volunteer", "Carol");
      const instructorId = await createTestUser("instructor", "Inst");

      const { shiftId } = await createFutureShift({
        volunteerUserIds: [volA, volB],
        instructorUserId: instructorId,
      });

      const reqA = await coverageService.createCoverageRequest(volA, {
        shiftId,
        category: "health",
        details: "A out",
      });
      const reqB = await coverageService.createCoverageRequest(volB, {
        shiftId,
        category: "conflict",
        details: "B out",
      });

      const svc1 = createConcurrentServices({
        id: volC,
        role: "volunteer",
        name: "Carol",
      });
      const svc2 = createConcurrentServices({
        id: volC,
        role: "volunteer",
        name: "Carol",
      });

      const outcomes = await Promise.allSettled([
        svc1.coverageService.fulfillCoverageRequest(volC, reqA),
        svc2.coverageService.fulfillCoverageRequest(volC, reqB),
      ]);

      const succeeded = outcomes.filter((o) => o.status === "fulfilled");
      const rejected = outcomes.filter((o) => o.status === "rejected");

      expect(succeeded).toHaveLength(1);
      expect(rejected).toHaveLength(1);
      expect((rejected[0] as PromiseRejectedResult).reason).toMatchObject({
        message: "Cannot cover a shift you are already assigned to.",
      });

      const rows = await scope.db
        .select()
        .from(coverageRequest)
        .where(eq(coverageRequest.shiftId, shiftId));
      const resolvedRows = rows.filter(
        (r) => r.status === CoverageStatus.resolved,
      );
      const openRows = rows.filter((r) => r.status === CoverageStatus.open);

      expect(resolvedRows).toHaveLength(1);
      expect(resolvedRows[0]!.coveredByVolunteerUserId).toBe(volC);
      expect(openRows).toHaveLength(1);
      expect(openRows[0]!.coveredByVolunteerUserId).toBeNull();

      // Effective roster has C once plus whichever requester remained uncovered.
      const effective =
        (
          await getEffectiveVolunteerAssignmentsForShifts(scope.db, [shiftId])
        ).get(shiftId) ?? [];
      expect(effective.filter((a) => a.volunteerUserId === volC)).toHaveLength(
        1,
      );
      expect(effective).toHaveLength(2);
    });

    it("serializes competing fulfillment against requester withdrawal so exactly one succeeds", async () => {
      const instructorId = await createTestUser("instructor", "Inst");

      // Run multiple rounds to exercise race interleaving in both directions.
      for (let i = 0; i < 4; i++) {
        const volA = await createTestUser("volunteer", `Alice${i}`);
        const volB = await createTestUser("volunteer", `Bob${i}`);
        const { shiftId } = await createFutureShift({
          volunteerUserIds: [volA],
          instructorUserId: instructorId,
        });

        const requestId = await coverageService.createCoverageRequest(volA, {
          shiftId,
          category: "conflict",
          details: `Round ${i}`,
        });

        const cancelSvc = createConcurrentServices({
          id: volA,
          role: "volunteer",
        });
        const fulfillSvc = createConcurrentServices({
          id: volB,
          role: "volunteer",
        });

        const [cancelRes, fulfillRes] = await Promise.allSettled([
          cancelSvc.coverageService.cancelCoverageRequest(volA, requestId),
          fulfillSvc.coverageService.fulfillCoverageRequest(volB, requestId),
        ]);

        const succeededCount = [cancelRes, fulfillRes].filter(
          (r) => r.status === "fulfilled",
        ).length;
        expect(succeededCount).toBe(1);

        const [reqRow] = await scope.db
          .select()
          .from(coverageRequest)
          .where(eq(coverageRequest.id, requestId));
        const effective =
          (
            await getEffectiveVolunteerAssignmentsForShifts(scope.db, [shiftId])
          ).get(shiftId) ?? [];

        if (fulfillRes.status === "fulfilled") {
          expect(reqRow!.status).toBe(CoverageStatus.resolved);
          expect(reqRow!.coveredByVolunteerUserId).toBe(volB);
          expect(reqRow!.requestingVolunteerUserId).toBe(volA);
          expect(effective.map((a) => a.volunteerUserId)).toEqual([volB]);
        } else {
          expect(reqRow!.status).toBe(CoverageStatus.withdrawn);
          expect(reqRow!.coveredByVolunteerUserId).toBeNull();
          expect(reqRow!.requestingVolunteerUserId).toBe(volA);
          expect(effective.map((a) => a.volunteerUserId)).toEqual([volA]);
        }
      }
    });

    it("serializes concurrent unassignment attempts so exactly one succeeds and original requester is preserved", async () => {
      const volA = await createTestUser("volunteer", "Alice");
      const volB = await createTestUser("volunteer", "Bob");
      const instructorId = await createTestUser("instructor", "Inst");

      const { shiftId } = await createFutureShift({
        volunteerUserIds: [volA],
        instructorUserId: instructorId,
      });

      const requestId = await coverageService.createCoverageRequest(volA, {
        shiftId,
        category: "health",
        details: "Need cover",
      });
      await coverageService.fulfillCoverageRequest(volB, requestId);

      const svcs = [0, 1, 2].map(() =>
        createConcurrentServices({ id: volB, role: "volunteer" }),
      );

      const outcomes = await Promise.allSettled(
        svcs.map((s) => s.coverageService.unassignCoverage(volB, requestId)),
      );

      expect(outcomes.filter((o) => o.status === "fulfilled")).toHaveLength(1);
      expect(outcomes.filter((o) => o.status === "rejected")).toHaveLength(2);

      const [reqRow] = await scope.db
        .select()
        .from(coverageRequest)
        .where(eq(coverageRequest.id, requestId));
      expect(reqRow!.status).toBe(CoverageStatus.open);
      expect(reqRow!.requestingVolunteerUserId).toBe(volA);
      expect(reqRow!.coveredByVolunteerUserId).toBeNull();
    });

    it("serializes shift cancellation against concurrent coverage fulfillment", async () => {
      const volA = await createTestUser("volunteer", "Alice");
      const volB = await createTestUser("volunteer", "Bob");
      const adminId = await createTestUser("admin", "Admin");
      const instructorId = await createTestUser("instructor", "Inst");

      const { shiftId } = await createFutureShift({
        volunteerUserIds: [volA],
        instructorUserId: instructorId,
      });

      const requestId = await coverageService.createCoverageRequest(volA, {
        shiftId,
        category: "emergency",
        details: "Need cover",
      });

      const adminSvc = createConcurrentServices({ id: adminId, role: "admin" });
      const fulfillSvc = createConcurrentServices({
        id: volB,
        role: "volunteer",
      });

      const [cancelRes, fulfillRes] = await Promise.allSettled([
        adminSvc.shiftService.cancelShift({
          shiftId,
          cancelReason: "Weather closure",
        }),
        fulfillSvc.coverageService.fulfillCoverageRequest(volB, requestId),
      ]);

      expect(cancelRes.status).toBe("fulfilled");

      const [shiftRow] = await scope.db
        .select({ canceled: shift.canceled })
        .from(shift)
        .where(eq(shift.id, shiftId));
      expect(shiftRow!.canceled).toBe(true);

      // Regardless of race order, once canceled any further mutation must reject.
      if (fulfillRes.status === "fulfilled") {
        await expect(
          coverageService.unassignCoverage(volB, requestId),
        ).rejects.toThrow(/canceled shift/i);
      } else {
        const [reqRow] = await scope.db
          .select()
          .from(coverageRequest)
          .where(eq(coverageRequest.id, requestId));
        expect(reqRow!.status).toBe(CoverageStatus.open);
        expect(reqRow!.coveredByVolunteerUserId).toBeNull();
      }
    });
  });

  describe("Canceled shifts reject attendance and coverage mutations", () => {
    it("rejects checkIn on a canceled shift for both volunteers and admins with override", async () => {
      const volA = await createTestUser("volunteer", "Alice");
      const adminId = await createTestUser("admin", "Admin");
      const instructorId = await createTestUser("instructor", "Inst");

      const { shiftId } = await createFutureShift({
        volunteerUserIds: [volA],
        instructorUserId: instructorId,
      });

      // Set startAt right now so the volunteer would otherwise be inside the
      // on-time check-in window, then mark the shift canceled directly.
      const now = new Date();
      await scope.db
        .update(shift)
        .set({
          startAt: now,
          endAt: new Date(now.getTime() + 60 * 60 * 1000),
          canceled: true,
          canceledAt: now,
          cancelReason: "Canceled for weather",
          cancelledByUserId: adminId,
        })
        .where(eq(shift.id, shiftId));

      scope.mockSession.setAsVolunteer({ id: volA });
      await expect(shiftService.checkIn(shiftId, volA)).rejects.toThrow(
        "Cannot check in to a canceled shift",
      );

      scope.mockSession.setAsAdmin({ id: adminId });
      await expect(shiftService.checkIn(shiftId, volA)).rejects.toThrow(
        "Cannot check in to a canceled shift",
      );

      const attendanceRows = await scope.db
        .select()
        .from(shiftAttendance)
        .where(eq(shiftAttendance.shiftId, shiftId));
      expect(attendanceRows).toHaveLength(0);
    });

    it("rejects create, cancel, fulfill, and unassign coverage mutations on a canceled shift", async () => {
      const volA = await createTestUser("volunteer", "Alice");
      const volB = await createTestUser("volunteer", "Bob");
      const volC = await createTestUser("volunteer", "Carol");
      const volD = await createTestUser("volunteer", "Dan");
      const adminId = await createTestUser("admin", "Admin");
      const instructorId = await createTestUser("instructor", "Inst");
      scope.mockSession.setAsAdmin({ id: adminId });

      const { shiftId } = await createFutureShift({
        volunteerUserIds: [volA, volB, volD],
        instructorUserId: instructorId,
      });

      // Create one open request (A) and one resolved request (B -> C) before canceling.
      const openReqId = await coverageService.createCoverageRequest(volA, {
        shiftId,
        category: "health",
        details: "A open request",
      });
      const resolvedReqId = await coverageService.createCoverageRequest(volB, {
        shiftId,
        category: "conflict",
        details: "B resolved request",
      });
      await coverageService.fulfillCoverageRequest(volC, resolvedReqId);

      // Cancel the shift.
      await shiftService.cancelShift({
        shiftId,
        cancelReason: "Holiday closure",
      });

      // 1. Creating a new coverage request on the canceled shift must fail.
      await expect(
        coverageService.createCoverageRequest(volD, {
          shiftId,
          category: "other",
          details: "D new request",
        }),
      ).rejects.toThrow(/canceled shift/i);

      // 2. Canceling/withdrawing an existing open request must fail.
      await expect(
        coverageService.cancelCoverageRequest(volA, openReqId),
      ).rejects.toThrow(/canceled shift/i);

      // 3. Fulfilling an existing open request must fail.
      await expect(
        coverageService.fulfillCoverageRequest(volD, openReqId),
      ).rejects.toThrow(/canceled shift/i);

      // 4. Unassigning an existing resolved request must fail.
      await expect(
        coverageService.unassignCoverage(volC, resolvedReqId),
      ).rejects.toThrow(/canceled shift/i);

      // Verify state of both requests remained untouched.
      const [openRow] = await scope.db
        .select()
        .from(coverageRequest)
        .where(eq(coverageRequest.id, openReqId));
      expect(openRow!.status).toBe(CoverageStatus.open);
      expect(openRow!.coveredByVolunteerUserId).toBeNull();

      const [resolvedRow] = await scope.db
        .select()
        .from(coverageRequest)
        .where(eq(coverageRequest.id, resolvedReqId));
      expect(resolvedRow!.status).toBe(CoverageStatus.resolved);
      expect(resolvedRow!.requestingVolunteerUserId).toBe(volB);
      expect(resolvedRow!.coveredByVolunteerUserId).toBe(volC);
    });
  });

  describe("Conditional state transition validation", () => {
    it("rejects self-fulfillment and invalid state transitions", async () => {
      const volA = await createTestUser("volunteer", "Alice");
      const volB = await createTestUser("volunteer", "Bob");
      const instructorId = await createTestUser("instructor", "Inst");

      const { shiftId } = await createFutureShift({
        volunteerUserIds: [volA],
        instructorUserId: instructorId,
      });

      const requestId = await coverageService.createCoverageRequest(volA, {
        shiftId,
        category: "health",
        details: "Need cover",
      });

      // Requester cannot fulfill their own open request.
      await expect(
        coverageService.fulfillCoverageRequest(volA, requestId),
      ).rejects.toThrow(/already assigned|own coverage request/i);

      // Fill once, then second fill and cancel both reject.
      await coverageService.fulfillCoverageRequest(volB, requestId);

      await expect(
        coverageService.fulfillCoverageRequest(volB, requestId),
      ).rejects.toThrow("Coverage request is not open.");

      await expect(
        coverageService.cancelCoverageRequest(volA, requestId),
      ).rejects.toThrow("Coverage request is not open.");

      // Unassign once, then second unassign rejects.
      await coverageService.unassignCoverage(volB, requestId);

      await expect(
        coverageService.unassignCoverage(volB, requestId),
      ).rejects.toThrow(/Could not find coverage request/);
    });
  });
});
