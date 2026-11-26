import { randomUUID } from "crypto";
import { asClass, asValue, createContainer, InjectionMode } from "awilix";
import { Temporal } from "@js-temporal/polyfill";
import { and, eq, inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import type { PgBoss } from "pg-boss";
import postgres from "postgres";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { env } from "@/env";
import type { NeuronContainer, NeuronCradle } from "@/server/api/di-container";
import type { Drizzle } from "@/server/db";
import * as schema from "@/server/db/schema";
import {
  course,
  coverageRequest,
  notification,
  shift,
  shiftAttendance,
  term,
  user,
  volunteer,
} from "@/server/db/schema";
import { checkShiftNotificationsJob } from "@/server/jobs/definitions/check-shift-notifications.job";
import { processNotificationJob } from "@/server/jobs/definitions/process-notification.job";
import {
  ClassService,
  type IClassService,
} from "@/server/services/entity/classService";
import {
  CoverageService,
  type ICoverageService,
} from "@/server/services/entity/coverageService";
import {
  ShiftService,
  type IShiftService,
} from "@/server/services/entity/shiftService";
import {
  TermService,
  type ITermService,
} from "@/server/services/entity/termService";
import {
  UserService,
  type IUserService,
} from "@/server/services/entity/userService";
import {
  VolunteerService,
  type IVolunteerService,
} from "@/server/services/entity/volunteerService";
import { JobService, type IJobService } from "@/server/services/jobService";
import {
  NotificationEventService,
  type INotificationEventService,
} from "@/server/services/notificationEventService";
import {
  NotificationService,
  type INotificationService,
} from "@/server/services/notificationService";
import {
  PreferenceService,
  type IPreferenceService,
} from "@/server/services/preferenceService";
import type { ICurrentSessionService } from "@/server/services/currentSessionService";
import type { IEmailService } from "@/server/services/emailService";
import type { IImageService } from "@/server/services/imageService";
import { MockCurrentSessionService } from "../mocks/mock-current-session-service";
import { MockEmailService } from "../mocks/mock-email-service";
import { MockImageService } from "../mocks/mock-image-service";

const fixtureYear = Temporal.Now.plainDateISO("UTC").add({ years: 1 }).year;

function createRealEventContainer(db: Drizzle): {
  container: NeuronContainer;
  mockSession: MockCurrentSessionService;
  emailService: MockEmailService;
  jobService: JobService;
} {
  const container = createContainer<NeuronCradle>({
    injectionMode: InjectionMode.PROXY,
    strict: true,
  });

  const mockSession = new MockCurrentSessionService();
  const emailService = new MockEmailService();
  const jobService = new JobService({ container, env });

  container.register({
    env: asValue(env),
    container: asValue(container),
    db: asValue(db),
    session: asValue(undefined),
    headers: asValue(new Headers()),
    currentSessionService: asValue<ICurrentSessionService>(mockSession),
    emailService: asValue<IEmailService>(emailService),
    imageService: asClass<IImageService>(MockImageService).singleton(),
    jobService: asValue<IJobService>(jobService),
    preferenceService: asClass<IPreferenceService>(PreferenceService).scoped(),
    notificationService:
      asClass<INotificationService>(NotificationService).scoped(),
    notificationEventService: asClass<INotificationEventService>(
      NotificationEventService,
    ).scoped(),
    userService: asClass<IUserService>(UserService).singleton(),
    volunteerService: asClass<IVolunteerService>(VolunteerService).singleton(),
    termService: asClass<ITermService>(TermService).scoped(),
    classService: asClass<IClassService>(ClassService).scoped(),
    shiftService: asClass<IShiftService>(ShiftService).scoped(),
    coverageService: asClass<ICoverageService>(CoverageService).scoped(),
  });

  return { container, mockSession, emailService, jobService };
}

describe("durable transactional domain events", () => {
  let conn: postgres.Sql;
  let db: Drizzle;
  let container: NeuronContainer;
  let mockSession: MockCurrentSessionService;
  let emailService: MockEmailService;
  let jobService: JobService;

  let createdUserIds: string[] = [];
  let createdTermIds: string[] = [];
  let createdClassIds: string[] = [];

  let adminId: string;
  let instructorId: string;
  let volunteer1Id: string;
  let volunteer2Id: string;
  let volunteer3Id: string;
  let volunteer4Id: string;

  const boss = (svc: JobService = jobService) =>
    (svc as unknown as { boss: PgBoss }).boss;

  beforeEach(async () => {
    conn = postgres(env.DATABASE_URL, { max: 8, onnotice: () => {} });
    db = drizzle(conn, { schema });
    ({ container, mockSession, emailService, jobService } =
      createRealEventContainer(db));

    await jobService.start();
    await db.delete(notification);

    adminId = randomUUID();
    instructorId = randomUUID();
    volunteer1Id = randomUUID();
    volunteer2Id = randomUUID();
    volunteer3Id = randomUUID();
    volunteer4Id = randomUUID();

    await db.insert(user).values([
      {
        id: adminId,
        name: "Admin",
        lastName: "User",
        email: `admin-${adminId}@test.com`,
        role: "admin",
        status: "active",
        emailVerified: true,
      },
      {
        id: instructorId,
        name: "Inst",
        lastName: "One",
        email: `inst-${instructorId}@test.com`,
        role: "instructor",
        status: "active",
        emailVerified: true,
      },
      {
        id: volunteer1Id,
        name: "Vol",
        lastName: "One",
        email: `vol1-${volunteer1Id}@test.com`,
        role: "volunteer",
        status: "active",
        emailVerified: true,
      },
      {
        id: volunteer2Id,
        name: "Vol",
        lastName: "Two",
        email: `vol2-${volunteer2Id}@test.com`,
        role: "volunteer",
        status: "active",
        emailVerified: true,
      },
      {
        id: volunteer3Id,
        name: "Vol",
        lastName: "Three",
        email: `vol3-${volunteer3Id}@test.com`,
        role: "volunteer",
        status: "active",
        emailVerified: true,
      },
      {
        id: volunteer4Id,
        name: "Vol",
        lastName: "Four",
        email: `vol4-${volunteer4Id}@test.com`,
        role: "volunteer",
        status: "active",
        emailVerified: true,
      },
    ]);
    createdUserIds.push(
      adminId,
      instructorId,
      volunteer1Id,
      volunteer2Id,
      volunteer3Id,
      volunteer4Id,
    );

    await db
      .insert(volunteer)
      .values([
        { userId: volunteer1Id },
        { userId: volunteer2Id },
        { userId: volunteer3Id },
        { userId: volunteer4Id },
      ]);

    mockSession.setAsAdmin({ id: adminId, name: "Admin", lastName: "User" });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    try {
      await jobService.stop();
    } catch {
      // Ignore stop errors during cleanup
    }
    await db.execute(sql`DROP SCHEMA IF EXISTS pgboss CASCADE`);
    await db.delete(notification);
    if (createdClassIds.length > 0) {
      await db.delete(course).where(inArray(course.id, createdClassIds));
      createdClassIds = [];
    }
    if (createdTermIds.length > 0) {
      await db.delete(term).where(inArray(term.id, createdTermIds));
      createdTermIds = [];
    }
    if (createdUserIds.length > 0) {
      await db.delete(user).where(inArray(user.id, createdUserIds));
      createdUserIds = [];
    }
    await container.dispose();
    await conn.end();
  });

  async function createPublishedClassWithShift(opts?: {
    dates?: string[];
    includeSecondScheduleForEligibleVolunteer?: boolean;
  }) {
    const termService = container.resolve("termService");
    const classService = container.resolve("classService");

    const termId = await termService.createTerm({
      name: `Durable Term ${randomUUID()}`,
      startDate: `${fixtureYear}-06-01`,
      endDate: `${fixtureYear}-08-31`,
      holidays: [],
    });
    createdTermIds.push(termId);
    await termService.publishTerm(termId);

    const schedules = [
      {
        localStartTime: Temporal.PlainTime.from("10:00:00"),
        localEndTime: Temporal.PlainTime.from("11:00:00"),
        volunteerUserIds: [volunteer1Id],
        preferredVolunteerCount: 1,
        instructorUserIds: [instructorId],
        rule: {
          type: "single" as const,
          extraDates: opts?.dates ?? [`${fixtureYear}-07-15`],
        },
      },
      ...(opts?.includeSecondScheduleForEligibleVolunteer
        ? [
            {
              localStartTime: Temporal.PlainTime.from("14:00:00"),
              localEndTime: Temporal.PlainTime.from("15:00:00"),
              volunteerUserIds: [volunteer2Id],
              preferredVolunteerCount: 1,
              instructorUserIds: [instructorId],
              rule: {
                type: "single" as const,
                extraDates: [`${fixtureYear}-07-16`],
              },
            },
          ]
        : []),
    ];

    const classId = await classService.createClass({
      termId,
      name: "Memory Class",
      lowerLevel: 1,
      upperLevel: 2,
      category: "literacy",
      schedules,
    });
    createdClassIds.push(classId);

    await classService.publishClass(classId);

    const shifts = await db
      .select()
      .from(shift)
      .where(eq(shift.courseId, classId));
    shifts.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
    const primaryShift = shifts[0]!;

    return {
      termId,
      classId,
      shiftId: primaryShift.id,
      scheduleId: primaryShift.scheduleId,
      shifts,
    };
  }

  describe("commit boundary", () => {
    it("rolls back shift cancellation and reminder cancellation if notification enqueue fails, then succeeds on retry", async () => {
      const { shiftId } = await createPublishedClassWithShift();
      const shiftService = container.resolve("shiftService");

      // Inject failure on pg-boss notification enqueue inside cancelShift.
      vi.spyOn(boss(), "send").mockRejectedValueOnce(
        new Error("queue enqueue failed"),
      );

      await expect(
        shiftService.cancelShift({ shiftId, cancelReason: "Instructor sick" }),
      ).rejects.toThrow("queue enqueue failed");

      // Shift remains uncanceled AND scheduled check jobs remain active ("created").
      const [afterFailure] = await db
        .select()
        .from(shift)
        .where(eq(shift.id, shiftId));
      expect(afterFailure?.canceled).toBe(false);

      const reminderBefore = await boss().findJobs(
        "jobs.check-shift-notifications",
        { key: `reminder:${shiftId}` },
      );
      const noCheckinBefore = await boss().findJobs(
        "jobs.check-shift-notifications",
        { key: `no-checkin:${shiftId}` },
      );
      expect(reminderBefore[0]?.state).toBe("created");
      expect(noCheckinBefore[0]?.state).toBe("created");
      expect(
        await boss().findJobs("jobs.process-notification", {
          key: `shift-cancelled-${shiftId}`,
        }),
      ).toHaveLength(0);

      // Retry now commits cancellation + cancels reminders + enqueues shift.cancelled atomically.
      await shiftService.cancelShift({
        shiftId,
        cancelReason: "Instructor sick",
      });
      // Subsequent retry returns early without duplicating the notification job.
      await shiftService.cancelShift({
        shiftId,
        cancelReason: "Instructor sick",
      });

      const [afterCommit] = await db
        .select()
        .from(shift)
        .where(eq(shift.id, shiftId));
      expect(afterCommit?.canceled).toBe(true);

      const reminderAfter = await boss().findJobs(
        "jobs.check-shift-notifications",
        { key: `reminder:${shiftId}` },
      );
      const noCheckinAfter = await boss().findJobs(
        "jobs.check-shift-notifications",
        { key: `no-checkin:${shiftId}` },
      );
      expect(reminderAfter[0]?.state).toBe("cancelled");
      expect(noCheckinAfter[0]?.state).toBe("cancelled");
      expect(
        await boss().findJobs("jobs.process-notification", {
          key: `shift-cancelled-${shiftId}`,
        }),
      ).toHaveLength(1);

      await vi.waitFor(
        async () => {
          const notifs = await db
            .select()
            .from(notification)
            .where(eq(notification.type, "shift.cancelled"));
          expect(notifs).toHaveLength(3);
          expect(emailService.sentEmails).toHaveLength(3);
        },
        { timeout: 10_000 },
      );
    });

    it("rolls back standalone shift creation and class publication shifts with their scheduled check jobs", async () => {
      const { scheduleId } = await createPublishedClassWithShift();
      const shiftService = container.resolve("shiftService");
      const startAt = new Date(`${fixtureYear}-08-10T10:00:00Z`).toISOString();
      const endAt = new Date(`${fixtureYear}-08-10T11:00:00Z`).toISOString();

      // Fail on the 2nd job enqueue (no-checkin) after shift + reminder were written in tx.
      const realSend = boss().send.bind(boss());
      let sendCalls = 0;
      vi.spyOn(boss(), "send").mockImplementation((async (
        ...args: Parameters<PgBoss["send"]>
      ) => {
        sendCalls++;
        if (sendCalls === 2) {
          throw new Error("no-checkin enqueue failed");
        }
        return realSend(...args);
      }) as PgBoss["send"]);

      const beforeShifts = await db
        .select()
        .from(shift)
        .where(eq(shift.scheduleId, scheduleId));
      const beforeJobs = await boss().findJobs(
        "jobs.check-shift-notifications",
      );

      await expect(
        shiftService.createShift({
          scheduleId,
          date: `${fixtureYear}-08-10`,
          startAt,
          endAt,
        }),
      ).rejects.toThrow("no-checkin enqueue failed");

      expect(
        await db.select().from(shift).where(eq(shift.scheduleId, scheduleId)),
      ).toHaveLength(beforeShifts.length);
      expect(
        await boss().findJobs("jobs.check-shift-notifications"),
      ).toHaveLength(beforeJobs.length);

      // Class publication rolling back mid-batch leaves neither published flag, shifts, nor jobs.
      vi.restoreAllMocks();
      const termService = container.resolve("termService");
      const classService = container.resolve("classService");
      const rollbackTermId = await termService.createTerm({
        name: `Rollback Term ${randomUUID()}`,
        startDate: `${fixtureYear}-06-01`,
        endDate: `${fixtureYear}-08-31`,
        holidays: [],
      });
      createdTermIds.push(rollbackTermId);
      const rollbackClassId = await classService.createClass({
        termId: rollbackTermId,
        name: "Rollback Publish Class",
        lowerLevel: 1,
        upperLevel: 2,
        category: "literacy",
        schedules: [
          {
            localStartTime: Temporal.PlainTime.from("10:00:00"),
            localEndTime: Temporal.PlainTime.from("11:00:00"),
            volunteerUserIds: [volunteer1Id],
            preferredVolunteerCount: 1,
            instructorUserIds: [instructorId],
            rule: {
              type: "single",
              extraDates: [`${fixtureYear}-08-12`, `${fixtureYear}-08-13`],
            },
          },
        ],
      });
      createdClassIds.push(rollbackClassId);

      // Fail on the 3rd job (2nd shift's reminder) during publishClass.
      const realPublishSend = boss().send.bind(boss());
      let publishSendCalls = 0;
      vi.spyOn(boss(), "send").mockImplementation((async (
        ...args: Parameters<PgBoss["send"]>
      ) => {
        publishSendCalls++;
        if (publishSendCalls === 3) {
          throw new Error("publish enqueue failure");
        }
        return realPublishSend(...args);
      }) as PgBoss["send"]);

      await expect(classService.publishClass(rollbackClassId)).rejects.toThrow(
        "publish enqueue failure",
      );

      const [unpublishedCourse] = await db
        .select({ published: course.published })
        .from(course)
        .where(eq(course.id, rollbackClassId));
      expect(unpublishedCourse?.published).toBe(false);
      expect(
        await db
          .select()
          .from(shift)
          .where(eq(shift.courseId, rollbackClassId)),
      ).toHaveLength(0);
      expect(
        await boss().findJobs("jobs.check-shift-notifications"),
      ).toHaveLength(beforeJobs.length);

      // Deleting a shift atomically cancels its scheduled reminder & no-checkin jobs.
      vi.restoreAllMocks();
      const createdShiftId = await shiftService.createShift({
        scheduleId,
        date: `${fixtureYear}-08-10`,
        startAt,
        endAt,
      });
      await shiftService.deleteShift({ shiftId: createdShiftId });

      const deletedReminder = await boss().findJobs(
        "jobs.check-shift-notifications",
        { key: `reminder:${createdShiftId}` },
      );
      const deletedNoCheckin = await boss().findJobs(
        "jobs.check-shift-notifications",
        { key: `no-checkin:${createdShiftId}` },
      );
      expect(deletedReminder[0]?.state).toBe("cancelled");
      expect(deletedNoCheckin[0]?.state).toBe("cancelled");
    });

    it("rolls back coverage request creation if either notification job fails, and cancels pending jobs on withdrawal", async () => {
      const { shiftId } = await createPublishedClassWithShift({
        includeSecondScheduleForEligibleVolunteer: true,
      });
      const coverageService = container.resolve("coverageService");

      // Fail on 2nd notification job (coverage.available) after coverage_request + coverage.requested wrote.
      const realSend = boss().send.bind(boss());
      let sendCalls = 0;
      vi.spyOn(boss(), "send").mockImplementation((async (
        ...args: Parameters<PgBoss["send"]>
      ) => {
        sendCalls++;
        if (sendCalls === 2) {
          throw new Error("coverage.available enqueue failed");
        }
        return realSend(...args);
      }) as PgBoss["send"]);

      mockSession.setAsVolunteer({
        id: volunteer1Id,
        name: "Vol",
        lastName: "One",
      });

      await expect(
        coverageService.createCoverageRequest(volunteer1Id, {
          shiftId,
          category: "emergency",
          details: "Family matter",
        }),
      ).rejects.toThrow("coverage.available enqueue failed");

      expect(
        await db
          .select()
          .from(coverageRequest)
          .where(eq(coverageRequest.shiftId, shiftId)),
      ).toHaveLength(0);
      expect(await boss().findJobs("jobs.process-notification")).toHaveLength(
        0,
      );

      // Delay notification job execution so withdrawal can cancel pending jobs before dispatch.
      vi.restoreAllMocks();
      const realRun = jobService.run.bind(jobService);
      vi.spyOn(jobService, "run").mockImplementation(((
        jobName: Parameters<IJobService["run"]>[0],
        data: Parameters<IJobService["run"]>[1],
        options: Parameters<IJobService["run"]>[2],
      ) =>
        realRun(jobName, data, {
          ...options,
          ...(jobName === "jobs.process-notification"
            ? { startAfter: 3600 }
            : {}),
        })) as IJobService["run"]);

      const requestId = await coverageService.createCoverageRequest(
        volunteer1Id,
        {
          shiftId,
          category: "emergency",
          details: "Family matter",
        },
      );

      await coverageService.cancelCoverageRequest(volunteer1Id, requestId);

      const requestedJobs = await boss().findJobs("jobs.process-notification", {
        key: `coverage-requested-${requestId}`,
      });
      const availableJobs = await boss().findJobs("jobs.process-notification", {
        key: `coverage-available-${requestId}`,
      });
      expect(requestedJobs[0]?.state).toBe("cancelled");
      expect(availableJobs[0]?.state).toBe("cancelled");
    });

    it("rolls back coverage fulfillment if notification enqueue fails, serializes concurrent fulfillments, and notifies after unassign + re-fulfill", async () => {
      const { shiftId } = await createPublishedClassWithShift();
      const coverageService = container.resolve("coverageService");

      mockSession.setAsVolunteer({
        id: volunteer1Id,
        name: "Vol",
        lastName: "One",
      });
      const requestId = await coverageService.createCoverageRequest(
        volunteer1Id,
        {
          shiftId,
          category: "conflict",
          details: "Exam",
        },
      );

      // Wait for coverage-requested job to settle first so our send spy isolates fulfillCoverageRequest.
      await vi.waitFor(
        async () => {
          const notifs = await db
            .select()
            .from(notification)
            .where(eq(notification.type, "coverage.requested"));
          expect(notifs).toHaveLength(2);
        },
        { timeout: 10_000 },
      );

      // Fail on 2nd notification job (coverage.filled-personal) inside fulfillCoverageRequest.
      const realSend = boss().send.bind(boss());
      let sendCalls = 0;
      vi.spyOn(boss(), "send").mockImplementation((async (
        ...args: Parameters<PgBoss["send"]>
      ) => {
        if (args[0] === "jobs.process-notification") {
          sendCalls++;
          if (sendCalls === 2) {
            throw new Error("coverage.filled-personal enqueue failed");
          }
        }
        return realSend(...args);
      }) as PgBoss["send"]);

      mockSession.setAsVolunteer({
        id: volunteer3Id,
        name: "Vol",
        lastName: "Three",
      });
      await expect(
        coverageService.fulfillCoverageRequest(volunteer3Id, requestId),
      ).rejects.toThrow("coverage.filled-personal enqueue failed");

      const [afterFail] = await db
        .select()
        .from(coverageRequest)
        .where(eq(coverageRequest.id, requestId));
      expect(afterFail?.status).toBe("open");
      expect(afterFail?.coveredByVolunteerUserId).toBeNull();
      expect(
        await boss().findJobs("jobs.process-notification", {
          key: `coverage-filled-${requestId}:${volunteer1Id}:${volunteer3Id}`,
        }),
      ).toHaveLength(0);

      // Concurrent fulfillments serialize via FOR UPDATE so only one volunteer wins.
      vi.restoreAllMocks();
      const [r1, r2] = await Promise.allSettled([
        coverageService.fulfillCoverageRequest(volunteer3Id, requestId),
        coverageService.fulfillCoverageRequest(volunteer4Id, requestId),
      ]);
      expect([r1, r2].filter((r) => r.status === "fulfilled")).toHaveLength(1);
      expect([r1, r2].filter((r) => r.status === "rejected")).toHaveLength(1);

      const [resolved] = await db
        .select()
        .from(coverageRequest)
        .where(eq(coverageRequest.id, requestId));
      const firstWinner = resolved!.coveredByVolunteerUserId!;
      const secondVolunteer =
        firstWinner === volunteer3Id ? volunteer4Id : volunteer3Id;

      await vi.waitFor(
        async () => {
          const personalNotifs = await db
            .select()
            .from(notification)
            .where(eq(notification.type, "coverage.filled-personal"));
          expect(personalNotifs).toHaveLength(1);
          expect(personalNotifs[0]?.userId).toBe(volunteer1Id);
        },
        { timeout: 10_000 },
      );

      // Unassign and re-fulfill by the other volunteer produces a distinct fulfillment notification.
      await coverageService.unassignCoverage(firstWinner, requestId);
      await coverageService.fulfillCoverageRequest(secondVolunteer, requestId);

      await vi.waitFor(
        async () => {
          const personalNotifs = await db
            .select()
            .from(notification)
            .where(eq(notification.type, "coverage.filled-personal"));
          expect(personalNotifs).toHaveLength(2);
          expect(personalNotifs.map((n) => n.userId).sort()).toEqual(
            [volunteer1Id, firstWinner].sort(),
          );
        },
        { timeout: 10_000 },
      );
    });
  });

  describe("dispatch boundary", () => {
    it("recovers from mid-fanout dispatch failure and SMTP failure with idempotent retries", async () => {
      const { shiftId } = await createPublishedClassWithShift();
      const shiftService = container.resolve("shiftService");

      // Inject failure during jobs.process-notification fan-out (2nd email enqueue fails),
      // so NotificationService rolls back its in-app notification inserts and fails the attempt.
      const realSend = boss().send.bind(boss());
      let emailEnqueues = 0;
      let injectedFanoutFailure = false;
      vi.spyOn(boss(), "send").mockImplementation((async (
        ...args: Parameters<PgBoss["send"]>
      ) => {
        if (args[0] === "jobs.send-email") {
          emailEnqueues++;
          if (!injectedFanoutFailure && emailEnqueues === 2) {
            injectedFanoutFailure = true;
            throw new Error("transient email enqueue failure");
          }
        }
        return realSend(...args);
      }) as PgBoss["send"]);

      // Also fail SMTP once on the first email attempt to exercise external transport retry.
      const realEmailSend = emailService.send.bind(emailService);
      let injectedSmtpFailure = false;
      vi.spyOn(emailService, "send").mockImplementation(async (...args) => {
        if (!injectedSmtpFailure) {
          injectedSmtpFailure = true;
          throw new Error("transient SMTP outage");
        }
        return realEmailSend(...args);
      });

      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await shiftService.cancelShift({ shiftId, cancelReason: "Weather" });

      // Wait for the initial notification job attempt to fail into "retry" state.
      await vi.waitFor(
        async () => {
          expect(injectedFanoutFailure).toBe(true);
          const jobs = await boss().findJobs("jobs.process-notification", {
            key: `shift-cancelled-${shiftId}`,
          });
          expect(jobs[0]?.state).toBe("retry");
        },
        { timeout: 10_000 },
      );

      // Because fan-out rolled back atomically, zero partial notifications exist while awaiting retry.
      expect(
        await db
          .select()
          .from(notification)
          .where(eq(notification.type, "shift.cancelled")),
      ).toHaveLength(0);

      // Expedite retry delay so pg-boss re-dispatches the notification job immediately.
      await db.execute(
        sql`UPDATE pgboss.job SET start_after = now() WHERE name = 'jobs.process-notification' AND state = 'retry'`,
      );

      // Wait for fan-out to commit all 3 in-app notifications and trigger the injected SMTP retry.
      await vi.waitFor(
        async () => {
          const notifs = await db
            .select()
            .from(notification)
            .where(eq(notification.type, "shift.cancelled"));
          expect(notifs).toHaveLength(3);
          expect(injectedSmtpFailure).toBe(true);
          const retryingEmails = await db.execute(
            sql`SELECT count(*)::int AS cnt FROM pgboss.job WHERE name = 'jobs.send-email' AND state = 'retry'`,
          );
          expect(
            (retryingEmails[0] as { cnt?: number } | undefined)?.cnt,
          ).toBeGreaterThanOrEqual(1);
        },
        { timeout: 10_000 },
      );

      // Expedite SMTP retry delay -> all 3 emails succeed without duplicating in-app notifications.
      await db.execute(
        sql`UPDATE pgboss.job SET start_after = now() WHERE name = 'jobs.send-email' AND state = 'retry'`,
      );

      await vi.waitFor(
        async () => {
          expect(emailService.sentEmails).toHaveLength(3);
        },
        { timeout: 10_000 },
      );

      errorSpy.mockRestore();

      // Re-running processNotification directly is strictly idempotent (no duplicate notifications or email jobs).
      const payload = (
        await boss().findJobs("jobs.process-notification", {
          key: `shift-cancelled-${shiftId}`,
        })
      )[0]!.data as Parameters<typeof processNotificationJob.handler>[0];
      await processNotificationJob.handler(payload, {
        container,
        cradle: container.cradle,
      });

      expect(
        await db
          .select()
          .from(notification)
          .where(eq(notification.type, "shift.cancelled")),
      ).toHaveLength(3);
      expect(await boss().findJobs("jobs.send-email")).toHaveLength(3);
    });

    it("executes check-shift-notifications reminders and no-checkin checks idempotently with coverage swaps and attendance", async () => {
      const { shiftId } = await createPublishedClassWithShift();
      const { shiftId: checkedInShiftId } = await createPublishedClassWithShift(
        { dates: [`${fixtureYear}-07-20`] },
      );

      // Mark volunteer1 checked in on the second shift so no-checkin stays silent for it.
      await db.insert(shiftAttendance).values({
        shiftId: checkedInShiftId,
        userId: volunteer1Id,
        status: "present",
        checkedInAt: new Date(),
      });

      // Inject failure on first reminder check attempt, then verify retry succeeds idempotently.
      vi.spyOn(boss(), "send").mockRejectedValueOnce(
        new Error("transient reminder enqueue failure"),
      );
      await expect(
        checkShiftNotificationsJob.handler(
          { shiftId, checkType: "reminder" },
          { container, cradle: container.cradle },
        ),
      ).rejects.toThrow("transient reminder enqueue failure");

      // Advance both check jobs for shiftId and no-checkin for checkedInShiftId to due now.
      await db.execute(
        sql`UPDATE pgboss.job SET start_after = now() WHERE name = 'jobs.check-shift-notifications' AND singleton_key IN (${`reminder:${shiftId}`}, ${`no-checkin:${shiftId}`}, ${`no-checkin:${checkedInShiftId}`})`,
      );

      await vi.waitFor(
        async () => {
          const reminderNotifs = await db
            .select()
            .from(notification)
            .where(eq(notification.type, "shift.reminder"));
          const noCheckinNotifs = await db
            .select()
            .from(notification)
            .where(eq(notification.type, "shift.no-checkin"));
          expect(reminderNotifs).toHaveLength(1);
          expect(reminderNotifs[0]?.userId).toBe(volunteer1Id);
          expect(noCheckinNotifs).toHaveLength(1);
          expect(noCheckinNotifs[0]?.sourceId).toBe(shiftId);
          expect(emailService.sentEmails).toHaveLength(2);
        },
        { timeout: 10_000 },
      );

      // Checked-in shift must never produce a no-checkin alert.
      const checkedInAlerts = await db
        .select()
        .from(notification)
        .where(
          and(
            eq(notification.type, "shift.no-checkin"),
            eq(notification.sourceId, checkedInShiftId),
          ),
        );
      expect(checkedInAlerts).toHaveLength(0);
    });
  });

  describe("restart boundary", () => {
    it("recovers committed shift creation, coverage request, coverage fulfillment, and cancellation events after worker restart", async () => {
      // Delay notification dispatch so jobs remain pending across the simulated crash/restart.
      const realRun = jobService.run.bind(jobService);
      vi.spyOn(jobService, "run").mockImplementation(((
        jobName: Parameters<IJobService["run"]>[0],
        data: Parameters<IJobService["run"]>[1],
        options: Parameters<IJobService["run"]>[2],
      ) =>
        realRun(jobName, data, {
          ...options,
          ...(jobName === "jobs.process-notification"
            ? { startAfter: 3600 }
            : {}),
        })) as IJobService["run"]);

      const { shiftId: activeShiftId } = await createPublishedClassWithShift({
        includeSecondScheduleForEligibleVolunteer: true,
      });
      const { shiftId: canceledShiftId } = await createPublishedClassWithShift({
        dates: [`${fixtureYear}-07-22`],
      });

      const coverageService = container.resolve("coverageService");
      const shiftService = container.resolve("shiftService");

      mockSession.setAsVolunteer({
        id: volunteer1Id,
        name: "Vol",
        lastName: "One",
      });
      const requestId = await coverageService.createCoverageRequest(
        volunteer1Id,
        {
          shiftId: activeShiftId,
          category: "health",
          details: "Doctor appointment",
        },
      );

      mockSession.setAsVolunteer({
        id: volunteer3Id,
        name: "Vol",
        lastName: "Three",
      });
      await coverageService.fulfillCoverageRequest(volunteer3Id, requestId);

      mockSession.setAsAdmin({ id: adminId, name: "Admin", lastName: "User" });
      await shiftService.cancelShift({
        shiftId: canceledShiftId,
        cancelReason: "Room unavailable",
      });

      // Simulate process shutdown/crash BEFORE any queued domain events were dispatched.
      vi.restoreAllMocks();
      await jobService.stop();
      await container.dispose();

      // Confirm zero notifications were created before restart.
      expect(await db.select().from(notification)).toHaveLength(0);

      // Make committed notification jobs and activeShiftId's reminder due on startup.
      await db.execute(
        sql`UPDATE pgboss.job SET start_after = now() WHERE name = 'jobs.process-notification' OR (name = 'jobs.check-shift-notifications' AND singleton_key = ${`reminder:${activeShiftId}`})`,
      );

      // Start a brand-new container and JobService simulating application restart.
      const restarted = createRealEventContainer(db);
      jobService = restarted.jobService;
      container = restarted.container;
      await restarted.jobService.start();

      await vi.waitFor(
        async () => {
          const allNotifs = await db.select().from(notification);
          const byType = (type: string) =>
            allNotifs.filter((n) => n.type === type);

          expect(byType("coverage.requested")).toHaveLength(2); // admin + instructor
          expect(byType("coverage.available")).toHaveLength(1); // volunteer2
          expect(byType("coverage.filled")).toHaveLength(2); // admin + instructor
          expect(byType("coverage.filled-personal")).toHaveLength(1); // volunteer1
          expect(byType("shift.cancelled")).toHaveLength(3); // admin + instructor + volunteer1
          // Reminder reflects the resolved coverage swap (volunteer3 covering for volunteer1).
          expect(byType("shift.reminder")).toHaveLength(1);
          expect(byType("shift.reminder")[0]?.userId).toBe(volunteer3Id);
          expect(restarted.emailService.sentEmails).toHaveLength(10);
        },
        { timeout: 30_000 },
      );
    }, 40_000);

    it("recovers pending email jobs after mid-pipeline SMTP failure and restart without duplicating in-app notifications", async () => {
      const { shiftId } = await createPublishedClassWithShift();

      // Fail all SMTP sends before restart while allowing notification fan-out to commit.
      vi.spyOn(emailService, "send").mockRejectedValue(
        new Error("SMTP unreachable"),
      );
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await container.resolve("shiftService").cancelShift({
        shiftId,
        cancelReason: "Power outage",
      });

      await vi.waitFor(
        async () => {
          expect(
            await db
              .select()
              .from(notification)
              .where(eq(notification.type, "shift.cancelled")),
          ).toHaveLength(3);
          const retrying = await db.execute(
            sql`SELECT count(*)::int AS cnt FROM pgboss.job WHERE name = 'jobs.send-email' AND state = 'retry'`,
          );
          expect((retrying[0] as { cnt?: number } | undefined)?.cnt).toBe(3);
        },
        { timeout: 10_000 },
      );
      errorSpy.mockRestore();

      // Simulate restart with a fresh container and healthy SMTP.
      vi.restoreAllMocks();
      await jobService.stop();
      await container.dispose();

      await db.execute(
        sql`UPDATE pgboss.job SET start_after = now() WHERE name = 'jobs.send-email' AND state = 'retry'`,
      );

      const restarted = createRealEventContainer(db);
      jobService = restarted.jobService;
      container = restarted.container;
      await restarted.jobService.start();

      await vi.waitFor(
        async () => {
          expect(restarted.emailService.sentEmails).toHaveLength(3);
        },
        { timeout: 10_000 },
      );
      // In-app notifications were not duplicated across restart recovery.
      expect(
        await db
          .select()
          .from(notification)
          .where(eq(notification.type, "shift.cancelled")),
      ).toHaveLength(3);
    });
  });
});
