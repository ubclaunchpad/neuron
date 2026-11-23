import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { randomUUID } from "crypto";
import { readFileSync } from "fs";
import path from "path";
import { Temporal } from "@js-temporal/polyfill";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, inArray, sql } from "drizzle-orm";
import { env } from "@/env";
import * as schema from "@/server/db/schema";
import {
  coverageRequest,
  notification,
  shift,
  shiftAttendance,
  user,
  volunteer,
  term,
  course,
} from "@/server/db/schema";
import { AttendanceStatus } from "@/models/interfaces";
import { CoverageRequestCategory, CoverageStatus } from "@/models/api/coverage";
import {
  ClassService,
  type IClassService,
} from "@/server/services/entity/classService";
import {
  ShiftService,
  type IShiftService,
} from "@/server/services/entity/shiftService";
import {
  TermService,
  type ITermService,
} from "@/server/services/entity/termService";
import { UserService } from "@/server/services/entity/userService";
import { VolunteerService } from "@/server/services/entity/volunteerService";
import { MockCurrentSessionService } from "../mocks/mock-current-session-service";
import { MockImageService } from "../mocks/mock-image-service";
import { MockJobService } from "../mocks/mock-job-service";
import { MockNotificationEventService } from "../mocks/mock-notification-services";
import {
  createTestScope,
  type ITestServiceScope,
} from "../helpers/test-service-scope";

describe("ClassService", () => {
  let scope: ITestServiceScope;
  let termService: ITermService;
  let classService: IClassService;

  let createdUserIds: string[] = [];
  let createdTermIds: string[] = [];
  let createdClassIds: string[] = [];

  let volunteerId: string;
  let instructorId: string;

  beforeEach(() => {
    scope = createTestScope();
    scope.mockSession.setAsAdmin();
    termService = scope.resolve<ITermService>("termService");
    classService = scope.resolve<IClassService>("classService");
  });

  beforeEach(async () => {
    volunteerId = randomUUID();
    instructorId = randomUUID();

    await scope.db.insert(user).values([
      {
        id: volunteerId,
        name: "Vol",
        lastName: "One",
        email: `vol-${Date.now()}-${randomUUID()}@test.com`,
        role: "volunteer",
        status: "active",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: instructorId,
        name: "Inst",
        lastName: "One",
        email: `inst-${Date.now()}-${randomUUID()}@test.com`,
        role: "instructor",
        status: "active",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    createdUserIds.push(volunteerId, instructorId);

    await scope.db.insert(volunteer).values([{ userId: volunteerId }]);
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

  async function createTermAndClass(opts?: { publishTerm?: boolean }) {
    const termId = await termService.createTerm({
      name: `Test Term ${randomUUID()}`,
      startDate: "2026-06-01",
      endDate: "2026-08-31",
      holidays: [],
    });
    createdTermIds.push(termId);

    if (opts?.publishTerm) {
      await termService.publishTerm(termId);
    }

    const classId = await classService.createClass({
      termId,
      name: `Test Class ${randomUUID()}`,
      lowerLevel: 1,
      upperLevel: 2,
      category: "literacy",
      schedules: [
        {
          localStartTime: Temporal.PlainTime.from("10:00:00"),
          localEndTime: Temporal.PlainTime.from("11:00:00"),
          volunteerUserIds: [volunteerId],
          preferredVolunteerCount: 1,
          instructorUserIds: [instructorId],
          rule: {
            type: "single",
            extraDates: ["2026-07-15"],
          },
        },
      ],
    });
    createdClassIds.push(classId);

    return { termId, classId };
  }

  describe("class creation", () => {
    it("should allow creating a non-exercise class without levels", async () => {
      const termId = await termService.createTerm({
        name: `Test Term ${randomUUID()}`,
        startDate: "2026-06-01",
        endDate: "2026-08-31",
        holidays: [],
      });
      createdTermIds.push(termId);

      const classId = await classService.createClass({
        termId,
        name: `Non-Exercise Class ${randomUUID()}`,
        lowerLevel: null,
        upperLevel: null,
        category: "Literacy",
        schedules: [],
      });
      createdClassIds.push(classId);

      const result = await classService.getClass(classId);
      expect(result.id).toBe(classId);
      expect(result.lowerLevel).toBeNull();
      expect(result.upperLevel).toBeNull();
    });
  });

  describe("term published visibility", () => {
    it("admin should see classes in unpublished terms via getClass", async () => {
      const { classId } = await createTermAndClass({ publishTerm: false });

      const result = await classService.getClass(classId);
      expect(result.id).toBe(classId);
    });

    it("volunteer should not see classes in unpublished terms via getClass", async () => {
      const { classId } = await createTermAndClass({ publishTerm: false });

      scope.mockSession.setAsVolunteer();

      await expect(classService.getClass(classId)).rejects.toThrow();
    });

    it("volunteer should see classes in published terms via getClass", async () => {
      const { classId } = await createTermAndClass({ publishTerm: true });

      scope.mockSession.setAsVolunteer();

      const result = await classService.getClass(classId);
      expect(result.id).toBe(classId);
    });

    it("admin should see classes in unpublished terms via getClassesForRequest", async () => {
      const { termId } = await createTermAndClass({ publishTerm: false });

      const result = await classService.getClassesForRequest({ term: termId });
      expect(result.classes.length).toBeGreaterThanOrEqual(1);
    });

    it("volunteer should not see unpublished terms via getClassesForRequest", async () => {
      const { termId } = await createTermAndClass({ publishTerm: false });

      scope.mockSession.setAsVolunteer();

      await expect(
        classService.getClassesForRequest({ term: termId }),
      ).rejects.toThrow();
    });

    it("volunteer should see published terms via getClassesForRequest", async () => {
      const { termId } = await createTermAndClass({ publishTerm: true });

      scope.mockSession.setAsVolunteer();

      const result = await classService.getClassesForRequest({
        term: termId,
      });
      expect(result.classes.length).toBeGreaterThanOrEqual(1);
    });

    it("volunteer should not see classes from unpublished terms in getClassesForSelect", async () => {
      const { classId } = await createTermAndClass({ publishTerm: false });

      scope.mockSession.setAsVolunteer();

      const result = await classService.getClassesForSelect();
      expect(result.some((c) => c.id === classId)).toBe(false);
    });

    it("volunteer should see classes from published terms in getClassesForSelect", async () => {
      const { classId } = await createTermAndClass({ publishTerm: true });

      scope.mockSession.setAsVolunteer();

      const result = await classService.getClassesForSelect();
      expect(result.some((c) => c.id === classId)).toBe(true);
    });

    it("volunteer should not see classes from unpublished terms via getClasses", async () => {
      const { classId } = await createTermAndClass({ publishTerm: false });

      scope.mockSession.setAsVolunteer();

      await expect(classService.getClasses([classId])).rejects.toThrow();
    });
  });

  describe("idempotent and concurrent publication", () => {
    it("produces exactly one shift per occurrence and schedules jobs once on repeated publish", async () => {
      const termId = await termService.createTerm({
        name: `Retry Term ${randomUUID()}`,
        startDate: "2027-06-01",
        endDate: "2027-08-31",
        holidays: [],
      });
      createdTermIds.push(termId);
      await termService.publishTerm(termId);

      const classId = await classService.createClass({
        termId,
        name: `Retry Class ${randomUUID()}`,
        lowerLevel: 1,
        upperLevel: 2,
        category: "literacy",
        schedules: [
          {
            localStartTime: Temporal.PlainTime.from("10:00:00"),
            localEndTime: Temporal.PlainTime.from("11:00:00"),
            volunteerUserIds: [volunteerId],
            preferredVolunteerCount: 1,
            instructorUserIds: [instructorId],
            rule: {
              type: "single",
              extraDates: ["2027-07-15"],
            },
          },
        ],
      });
      createdClassIds.push(classId);

      const mockJobService = scope.resolve<MockJobService>("jobService");

      const first = await classService.publishClass(classId);
      const shiftsAfterFirst = await scope.db
        .select()
        .from(shift)
        .where(eq(shift.courseId, classId));
      const jobCallsAfterFirst = mockJobService.calls.length;

      const second = await classService.publishClass(classId);
      const shiftsAfterSecond = await scope.db
        .select()
        .from(shift)
        .where(eq(shift.courseId, classId));

      expect(first).toEqual({
        classId,
        status: "published",
        createdShiftCount: 1,
      });
      expect(second).toEqual({
        classId,
        status: "already_published",
        createdShiftCount: 0,
      });
      expect(shiftsAfterFirst).toHaveLength(1);
      expect(shiftsAfterSecond).toHaveLength(1);
      expect(shiftsAfterSecond[0]!.id).toBe(shiftsAfterFirst[0]!.id);
      // 1 future shift schedules 2 jobs (reminder + no-checkin); retry schedules 0 more.
      expect(jobCallsAfterFirst).toBe(2);
      expect(mockJobService.calls.length).toBe(2);
    });

    it("marks a zero-schedule class as published and stays idempotent on retry", async () => {
      const termId = await termService.createTerm({
        name: `Zero Schedule Term ${randomUUID()}`,
        startDate: "2027-01-04",
        endDate: "2027-04-30",
        holidays: [],
      });
      createdTermIds.push(termId);

      const classId = await classService.createClass({
        termId,
        name: `Zero Schedule Class ${randomUUID()}`,
        lowerLevel: null,
        upperLevel: null,
        category: "Literacy",
        schedules: [],
      });
      createdClassIds.push(classId);

      const first = await classService.publishClass(classId);
      const second = await classService.publishClass(classId);
      const cls = await classService.getClass(classId);

      expect(first).toEqual({
        classId,
        status: "published",
        createdShiftCount: 0,
      });
      expect(second).toEqual({
        classId,
        status: "already_published",
        createdShiftCount: 0,
      });
      expect(cls.published).toBe(true);
    });

    it("serializes concurrent publishClass calls across separate DB connections without duplicating shifts", async () => {
      const termId = await termService.createTerm({
        name: `Concurrent Term ${randomUUID()}`,
        startDate: "2027-01-04",
        endDate: "2027-01-25",
        holidays: [],
      });
      createdTermIds.push(termId);

      const classId = await classService.createClass({
        termId,
        name: `Concurrent Weekly Class ${randomUUID()}`,
        lowerLevel: 1,
        upperLevel: 2,
        category: "literacy",
        schedules: [
          {
            localStartTime: Temporal.PlainTime.from("10:00:00"),
            localEndTime: Temporal.PlainTime.from("11:00:00"),
            volunteerUserIds: [volunteerId],
            preferredVolunteerCount: 1,
            instructorUserIds: [instructorId],
            rule: {
              type: "weekly",
              weekday: "MO",
              interval: 1,
            },
          },
        ],
      });
      createdClassIds.push(classId);

      // Use a multi-connection pool so concurrent transactions genuinely race in Postgres.
      const poolConn = postgres(env.DATABASE_URL, {
        max: 5,
        onnotice: () => {},
      });
      try {
        const poolDb = drizzle(poolConn, { schema });
        const sharedJobService = new MockJobService();
        const makeConcurrentClassService = () => {
          const mockSession = new MockCurrentSessionService();
          mockSession.setAsAdmin();
          const concurrentShiftService = new ShiftService({
            db: poolDb,
            currentSessionService: mockSession,
            notificationEventService: new MockNotificationEventService(),
            jobService: sharedJobService,
          });
          return new ClassService({
            db: poolDb,
            currentSessionService: mockSession,
            userService: new UserService({
              db: poolDb,
              jobService: sharedJobService,
            }),
            volunteerService: new VolunteerService({ db: poolDb }),
            termService: new TermService({
              db: poolDb,
              currentSessionService: mockSession,
            }),
            shiftService: concurrentShiftService,
            imageService: new MockImageService(),
          });
        };

        const outcomes = await Promise.all(
          Array.from({ length: 5 }, () =>
            makeConcurrentClassService().publishClass(classId),
          ),
        );

        const publishedOutcomes = outcomes.filter(
          (o) => o.status === "published",
        );
        const alreadyPublishedOutcomes = outcomes.filter(
          (o) => o.status === "already_published",
        );

        expect(publishedOutcomes).toHaveLength(1);
        expect(publishedOutcomes[0]!.createdShiftCount).toBe(4);
        expect(alreadyPublishedOutcomes).toHaveLength(4);

        const shifts = await scope.db
          .select()
          .from(shift)
          .where(eq(shift.courseId, classId));
        expect(shifts.map((s) => s.date).sort()).toEqual([
          "2027-01-04",
          "2027-01-11",
          "2027-01-18",
          "2027-01-25",
        ]);
        // 4 future shifts * 2 jobs (reminder + no-checkin) scheduled only once
        expect(sharedJobService.calls).toHaveLength(8);
      } finally {
        await poolConn.end();
      }
    });
  });

  describe("single-date schedule boundaries and blackouts", () => {
    it("preserves a sole explicit date matching term startDate (2027-01-04)", async () => {
      const termId = await termService.createTerm({
        name: `Boundary Start Term ${randomUUID()}`,
        startDate: "2027-01-04",
        endDate: "2027-04-30",
        holidays: [],
      });
      createdTermIds.push(termId);

      const classId = await classService.createClass({
        termId,
        name: `Start Boundary Class ${randomUUID()}`,
        lowerLevel: 1,
        upperLevel: 2,
        category: "literacy",
        schedules: [
          {
            localStartTime: Temporal.PlainTime.from("10:00:00"),
            localEndTime: Temporal.PlainTime.from("11:00:00"),
            volunteerUserIds: [volunteerId],
            preferredVolunteerCount: 1,
            instructorUserIds: [instructorId],
            rule: {
              type: "single",
              extraDates: ["2027-01-04"],
            },
          },
        ],
      });
      createdClassIds.push(classId);

      const result = await classService.publishClass(classId);
      const shifts = await scope.db
        .select()
        .from(shift)
        .where(eq(shift.courseId, classId));

      expect(result.createdShiftCount).toBe(1);
      expect(shifts.map((s) => s.date)).toEqual(["2027-01-04"]);
    });

    it("preserves explicit start/end boundary dates while honoring term holidays", async () => {
      const termId = await termService.createTerm({
        name: `Boundary Blackout Term ${randomUUID()}`,
        startDate: "2027-01-04",
        endDate: "2027-04-30",
        holidays: [{ startsOn: "2027-01-04", endsOn: "2027-01-04" }],
      });
      createdTermIds.push(termId);

      const classId = await classService.createClass({
        termId,
        name: `Boundary Blackout Class ${randomUUID()}`,
        lowerLevel: 1,
        upperLevel: 2,
        category: "literacy",
        schedules: [
          {
            localStartTime: Temporal.PlainTime.from("10:00:00"),
            localEndTime: Temporal.PlainTime.from("11:00:00"),
            volunteerUserIds: [volunteerId],
            preferredVolunteerCount: 1,
            instructorUserIds: [instructorId],
            rule: {
              type: "single",
              extraDates: ["2027-01-04", "2027-04-30"],
            },
          },
        ],
      });
      createdClassIds.push(classId);

      const result = await classService.publishClass(classId);
      const shifts = await scope.db
        .select()
        .from(shift)
        .where(eq(shift.courseId, classId));

      expect(result.createdShiftCount).toBe(1);
      expect(shifts.map((s) => s.date)).toEqual(["2027-04-30"]);
    });
  });

  describe("occurrence uniqueness and duplicate reconciliation", () => {
    it("enforces Postgres unique constraint on (schedule_id, date) and keeps createShift idempotent", async () => {
      const { classId } = await createTermAndClass({ publishTerm: true });
      await classService.publishClass(classId);

      const [existingShift] = await scope.db
        .select()
        .from(shift)
        .where(eq(shift.courseId, classId));
      expect(existingShift).toBeDefined();

      // Direct insert violating uq_shift_schedule_date must fail with Postgres 23505.
      await expect(
        scope.db.insert(shift).values({
          courseId: existingShift!.courseId,
          scheduleId: existingShift!.scheduleId,
          date: existingShift!.date,
          startAt: existingShift!.startAt,
          endAt: existingShift!.endAt,
        }),
      ).rejects.toSatisfy((err: unknown) => {
        const pgErr = err as { code?: string; cause?: { code?: string } };
        return pgErr.code === "23505" || pgErr.cause?.code === "23505";
      });

      // ShiftService.createShift handles duplicate occurrence idempotently.
      const shiftService = scope.resolve<IShiftService>("shiftService");
      const returnedId = await shiftService.createShift({
        scheduleId: existingShift!.scheduleId,
        date: existingShift!.date,
        startAt: existingShift!.startAt.toISOString(),
        endAt: existingShift!.endAt.toISOString(),
      });
      expect(returnedId).toBe(existingShift!.id);
    });

    it("reconciles pre-existing duplicate shifts without losing attendance, coverage, or notifications", async () => {
      const volunteer2Id = randomUUID();
      await scope.db.insert(user).values({
        id: volunteer2Id,
        name: "Vol",
        lastName: "Two",
        email: `vol2-${Date.now()}-${randomUUID()}@test.com`,
        role: "volunteer",
        status: "active",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      createdUserIds.push(volunteer2Id);
      await scope.db.insert(volunteer).values({ userId: volunteer2Id });

      const { classId } = await createTermAndClass({ publishTerm: true });
      await classService.publishClass(classId);

      const [baseShift] = await scope.db
        .select()
        .from(shift)
        .where(eq(shift.courseId, classId));
      expect(baseShift).toBeDefined();

      const dupShiftId1 = randomUUID();
      const dupShiftId2 = randomUUID();
      const notifId = randomUUID();
      const migrationSql = readFileSync(
        path.resolve(
          process.cwd(),
          "src/server/db/migrations/0011_add_unique_shift_occurrence.sql",
        ),
        "utf8",
      );
      const statements = migrationSql
        .split("--> statement-breakpoint")
        .map((s) => s.trim())
        .filter(Boolean);

      try {
        // Temporarily drop the unique index to simulate legacy duplicate shift rows.
        await scope.db.execute(
          sql`DROP INDEX IF EXISTS "uq_shift_schedule_date"`,
        );

        await scope.db.insert(shift).values([
          {
            id: dupShiftId1,
            courseId: baseShift!.courseId,
            scheduleId: baseShift!.scheduleId,
            date: baseShift!.date,
            startAt: baseShift!.startAt,
            endAt: baseShift!.endAt,
          },
          {
            id: dupShiftId2,
            courseId: baseShift!.courseId,
            scheduleId: baseShift!.scheduleId,
            date: baseShift!.date,
            startAt: baseShift!.startAt,
            endAt: baseShift!.endAt,
          },
        ]);

        // Attendance on both baseShift (volunteer 1) and dupShiftId1 (volunteer 1 + volunteer 2).
        await scope.db.insert(shiftAttendance).values([
          {
            shiftId: baseShift!.id,
            userId: volunteerId,
            status: AttendanceStatus.present,
            checkedInAt: new Date("2026-07-15T16:55:00Z"),
          },
          {
            shiftId: dupShiftId1,
            userId: volunteerId,
            status: AttendanceStatus.late,
            checkedInAt: new Date("2026-07-15T17:10:00Z"),
          },
          {
            shiftId: dupShiftId1,
            userId: volunteer2Id,
            status: AttendanceStatus.present,
            checkedInAt: new Date("2026-07-15T16:58:00Z"),
          },
        ]);

        // Conflicting active coverage requests for volunteerId: open on baseShift, resolved on dupShiftId2.
        await scope.db.insert(coverageRequest).values([
          {
            shiftId: baseShift!.id,
            category: CoverageRequestCategory.other,
            details: "Open request on base shift",
            status: CoverageStatus.open,
            requestingVolunteerUserId: volunteerId,
          },
          {
            shiftId: dupShiftId2,
            category: CoverageRequestCategory.other,
            details: "Resolved request on duplicate shift",
            status: CoverageStatus.resolved,
            requestingVolunteerUserId: volunteerId,
            coveredByVolunteerUserId: volunteer2Id,
          },
        ]);

        // Shift-sourced notification pointing to dupShiftId2.
        await scope.db.insert(notification).values({
          id: notifId,
          userId: volunteerId,
          type: "shift.reminder",
          title: "Reminder",
          body: "Shift soon",
          sourceType: "shift",
          sourceId: dupShiftId2,
        });

        // Execute the exact migration statements.
        for (const stmt of statements) {
          await scope.db.execute(sql.raw(stmt));
        }

        const remainingShifts = await scope.db
          .select()
          .from(shift)
          .where(eq(shift.scheduleId, baseShift!.scheduleId));
        expect(remainingShifts).toHaveLength(1);
        const survivingShiftId = remainingShifts[0]!.id;

        const mergedAttendance = await scope.db
          .select()
          .from(shiftAttendance)
          .where(eq(shiftAttendance.shiftId, survivingShiftId));
        expect(mergedAttendance.map((a) => a.userId).sort()).toEqual(
          [volunteerId, volunteer2Id].sort(),
        );

        const mergedCoverage = await scope.db
          .select()
          .from(coverageRequest)
          .where(eq(coverageRequest.shiftId, survivingShiftId));
        expect(mergedCoverage).toHaveLength(2);
        expect(
          mergedCoverage.filter((c) => c.status === CoverageStatus.resolved),
        ).toHaveLength(1);
        expect(
          mergedCoverage.filter((c) => c.status === CoverageStatus.withdrawn),
        ).toHaveLength(1);

        const [repointedNotif] = await scope.db
          .select()
          .from(notification)
          .where(eq(notification.id, notifId));
        expect(repointedNotif?.sourceId).toBe(survivingShiftId);
      } finally {
        await scope.db.delete(notification).where(eq(notification.id, notifId));
        await scope.db
          .delete(shift)
          .where(inArray(shift.id, [dupShiftId1, dupShiftId2]));
        await scope.db.execute(
          sql`CREATE UNIQUE INDEX IF NOT EXISTS "uq_shift_schedule_date" ON "shift" USING btree ("schedule_id","date")`,
        );
      }
    });
  });

  describe("bulk publication (publishAllClasses)", () => {
    it("exposes per-class outcomes on partial failure and supports clean retry", async () => {
      const { classId: classA } = await createTermAndClass({
        publishTerm: true,
      });
      const { classId: classB } = await createTermAndClass({
        publishTerm: true,
      });
      const { classId: classC } = await createTermAndClass({
        publishTerm: true,
      });

      const originalPublish = classService.publishClass.bind(classService);
      const publishSpy = vi
        .spyOn(classService, "publishClass")
        .mockImplementation(async (id: string) => {
          if (id === classB) {
            throw new Error("Simulated transient failure");
          }
          return originalPublish(id);
        });

      const firstBulk = await classService.publishAllClasses();
      publishSpy.mockRestore();

      expect(firstBulk.total).toBe(3);
      expect(firstBulk.publishedCount).toBe(2);
      expect(firstBulk.alreadyPublishedCount).toBe(0);
      expect(firstBulk.failedCount).toBe(1);
      expect(firstBulk.results).toEqual(
        expect.arrayContaining([
          { classId: classA, status: "published", createdShiftCount: 1 },
          {
            classId: classB,
            status: "failed",
            error: "Simulated transient failure",
          },
          { classId: classC, status: "published", createdShiftCount: 1 },
        ]),
      );

      // Healthy classes are published; failed class stays unpublished with 0 shifts.
      expect((await classService.getClass(classA)).published).toBe(true);
      expect((await classService.getClass(classB)).published).toBe(false);
      expect((await classService.getClass(classC)).published).toBe(true);
      expect(
        await scope.db.select().from(shift).where(eq(shift.courseId, classB)),
      ).toHaveLength(0);

      // Retrying publishAllClasses publishes only the previously failed class.
      const retryBulk = await classService.publishAllClasses();
      expect(retryBulk.total).toBe(1);
      expect(retryBulk.publishedCount).toBe(1);
      expect(retryBulk.failedCount).toBe(0);
      expect(retryBulk.results).toEqual([
        { classId: classB, status: "published", createdShiftCount: 1 },
      ]);

      // All three classes have exactly 1 shift each.
      for (const id of [classA, classB, classC]) {
        const rows = await scope.db
          .select()
          .from(shift)
          .where(eq(shift.courseId, id));
        expect(rows).toHaveLength(1);
      }
    });
  });
});
