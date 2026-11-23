import { UserService } from "@/server/services/entity/userService";
import { NotificationService } from "@/server/services/notificationService";
import type { IJobService } from "@/server/services/jobService";
import { MockPreferenceService } from "../mocks/mock-notification-services";
import { notification } from "@/server/db/schema";
import { randomUUID } from "crypto";
import { user } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/server/db/schema";
import type { PgBoss } from "pg-boss";
import {
  describe,
  it,
  expect,
  expectTypeOf,
  beforeEach,
  afterEach,
  vi,
} from "vitest";
import type { Transaction } from "@/server/db";
import {
  createContainer,
  asValue,
  InjectionMode,
  type AwilixContainer,
} from "awilix";
import { sql } from "drizzle-orm";
import { env } from "@/env";
import { getTestDb } from "../test-db";
import { JobService } from "@/server/services/jobService";
import type {
  JobRuntimeContext,
  RegisteredJob,
  RunJobOptions,
  StartupSchedule,
} from "@/server/jobs/types";

// Loose interface so test job names and payloads bypass the strict
// RunnableJobName / JobPayload generic constraints.
interface TestableJobService {
  start(): Promise<void>;
  stop(): Promise<void>;
  run(
    jobName: string,
    data?: unknown,
    options?: RunJobOptions,
  ): Promise<string | null>;
  cancelPending(
    name: string,
    key: string,
    options: { transaction: import("@/server/db").Transaction },
  ): Promise<void>;
  unschedule(
    jobName: string,
    options?: { correlationId?: string },
  ): Promise<void>;
}

// Test job definitions (hoisted for vi.mock)

type TestPayload = { message: string };

const { testJob, failingJob, emailJob, handlerCalls } = vi.hoisted(() => {
  const handlerCalls: { payload: TestPayload; context: JobRuntimeContext }[] =
    [];

  const testJob: RegisteredJob<TestPayload> = {
    name: "jobs.integration-test",
    retryOpts: { retryLimit: 0 },
    handler: async (payload: TestPayload, context: JobRuntimeContext) => {
      handlerCalls.push({ payload, context });
    },
  };

  const failingJob: RegisteredJob<TestPayload> = {
    name: "jobs.integration-test-fail",
    retryOpts: { retryLimit: 0 },
    handler: async () => {
      throw new Error("Intentional test failure");
    },
  };

  const emailJob: RegisteredJob<{
    to: string;
    subject: string;
    text: string;
    html?: string;
  }> = {
    name: "jobs.send-email",
    retryOpts: { retryLimit: 0 },
    handler: async () => {},
  };
  return { testJob, failingJob, emailJob, handlerCalls };
});

// Mock the job registry so JobService sees our test jobs

vi.mock("@/server/jobs/registry", () => {
  const jobs: RegisteredJob<any>[] = [testJob, failingJob, emailJob];
  const byName = new Map(jobs.map((j) => [j.name, j]));
  const knownNames: Set<string> = new Set(jobs.map((j) => j.name));

  return {
    registeredJobs: jobs,
    jobsByName: byName,
    isKnownJobName: (name: string): boolean => knownNames.has(name),
    isRegisteredJobName: (name: string): boolean => knownNames.has(name),
  };
});

// Helpers

const testEnv = { ...env, NODE_ENV: "development" as const };

function createJobTestContainer(): AwilixContainer {
  const container = createContainer({
    injectionMode: InjectionMode.PROXY,
    strict: false,
  });

  container.register({
    env: asValue(testEnv),
    container: asValue(container),
    db: asValue(getTestDb()),
    session: asValue(undefined),
    headers: asValue(new Headers()),
  });

  return container;
}

async function waitForHandlerCalls(
  count = 1,
  timeoutMs = 10_000,
  intervalMs = 100,
): Promise<void> {
  const start = Date.now();
  while (handlerCalls.length < count) {
    if (Date.now() - start > timeoutMs) {
      throw new Error(
        `Timed out waiting for handler calls. Expected ${count}, got ${handlerCalls.length}`,
      );
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

describe("job option types", () => {
  it("accepts one-off, transactional replacement, and recurring options", () => {
    expectTypeOf<{ runAt: Date }>().toExtend<RunJobOptions>();
    expectTypeOf<{
      startAfter: number;
      transaction: Transaction;
      idempotencyKey: string;
    }>().toExtend<RunJobOptions>();
    expectTypeOf<{
      replacePending: true;
      transaction: Transaction;
      singletonKey: string;
    }>().toExtend<RunJobOptions>();
    expectTypeOf<{
      cron: string;
      correlationId: string;
      startAt: Date;
      endAt: Date;
    }>().toExtend<RunJobOptions>();
  });

  it("excludes incompatible scheduling and replacement options", () => {
    expectTypeOf<{
      runAt: Date;
      startAfter: number;
    }>().not.toExtend<RunJobOptions>();
    expectTypeOf<{ correlationId: string }>().not.toExtend<RunJobOptions>();
    expectTypeOf<{ startAt: Date }>().not.toExtend<RunJobOptions>();
    expectTypeOf<{ endAt: Date }>().not.toExtend<RunJobOptions>();
    expectTypeOf<{ cron: string; runAt: Date }>().not.toExtend<RunJobOptions>();
    expectTypeOf<{
      cron: string;
      startAfter: number;
    }>().not.toExtend<RunJobOptions>();
    expectTypeOf<{
      cron: string;
      transaction: Transaction;
    }>().not.toExtend<RunJobOptions>();
    expectTypeOf<{
      cron: string;
      idempotencyKey: string;
    }>().not.toExtend<RunJobOptions>();
    expectTypeOf<{
      replacePending: true;
      singletonKey: string;
    }>().not.toExtend<RunJobOptions>();
    expectTypeOf<{
      replacePending: true;
      transaction: Transaction;
    }>().not.toExtend<RunJobOptions>();
    expectTypeOf<{
      replacePending: true;
      transaction: Transaction;
      singletonKey: string;
      idempotencyKey: string;
    }>().not.toExtend<RunJobOptions>();
  });

  it("restricts startup options to their scheduling mode without caller transactions", () => {
    expectTypeOf<{
      options: { startAfter: number; idempotencyKey: string };
    }>().toExtend<StartupSchedule<TestPayload>>();
    expectTypeOf<{
      cron: string;
      options: { correlationId: string };
    }>().toExtend<StartupSchedule<TestPayload>>();
    expectTypeOf<{
      options: {
        replacePending: true;
        transaction: Transaction;
        singletonKey: string;
      };
    }>().not.toExtend<StartupSchedule<TestPayload>>();
    expectTypeOf<{ options: { transaction: Transaction } }>().not.toExtend<
      StartupSchedule<TestPayload>
    >();
    expectTypeOf<{
      cron: string;
      options: { startAfter: number };
    }>().not.toExtend<StartupSchedule<TestPayload>>();
    expectTypeOf<{ options: { correlationId: string } }>().not.toExtend<
      StartupSchedule<TestPayload>
    >();
  });
});

describe("JobService", () => {
  let container: AwilixContainer;
  let jobService: TestableJobService;

  beforeEach(() => {
    container = createJobTestContainer();
    jobService = new JobService({
      container: container as any,
      env: testEnv,
    }) as unknown as TestableJobService;
    handlerCalls.length = 0;
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    try {
      await jobService.stop();
    } catch {
      // Ignore stop errors during cleanup
    }

    const db = getTestDb();
    await db.execute(sql`DROP SCHEMA IF EXISTS pgboss CASCADE`);
  });

  const boss = () => (jobService as unknown as { boss: PgBoss }).boss;

  describe("transactional enqueue", () => {
    it("commits application state and job together, invisible to workers until commit", async () => {
      await jobService.start();
      const userId = randomUUID();
      let id: string | null = null;
      try {
        await getTestDb().transaction(async (transaction) => {
          await transaction.insert(user).values({
            id: userId,
            name: "Transaction",
            lastName: "Test",
            email: `${userId}@test.com`,
            role: "volunteer",
            status: "active",
          });
          id = await jobService.run(
            "jobs.integration-test",
            { message: "committed" },
            { transaction },
          );
          expect(id).toBeTypeOf("string");
          expect(
            await boss().findJobs("jobs.integration-test", { id: id! }),
          ).toHaveLength(0);
          expect(handlerCalls).toHaveLength(0);
        });
        await waitForHandlerCalls();
        expect(handlerCalls[0]?.payload.message).toBe("committed");
        expect(
          await getTestDb().select().from(user).where(eq(user.id, userId)),
        ).toHaveLength(1);
      } finally {
        await getTestDb().delete(user).where(eq(user.id, userId));
      }
    });

    it("rolls back both application state and the job", async () => {
      await jobService.start();
      const userId = randomUUID();
      let id: string | null = null;
      await expect(
        getTestDb().transaction(async (transaction) => {
          await transaction.insert(user).values({
            id: userId,
            name: "Rollback",
            lastName: "Test",
            email: `${userId}@test.com`,
            role: "volunteer",
            status: "active",
          });
          id = await jobService.run(
            "jobs.integration-test",
            { message: "rolled back" },
            { transaction },
          );
          throw new Error("rollback");
        }),
      ).rejects.toThrow("rollback");
      expect(
        await getTestDb().select().from(user).where(eq(user.id, userId)),
      ).toHaveLength(0);
      expect(
        await boss().findJobs("jobs.integration-test", { id: id! }),
      ).toHaveLength(0);
      expect(handlerCalls).toHaveLength(0);
    });

    it("rolls back application state when enqueue fails", async () => {
      await jobService.start();
      vi.spyOn(boss(), "send").mockRejectedValueOnce(
        new Error("enqueue unavailable"),
      );
      const userId = randomUUID();
      await expect(
        getTestDb().transaction(async (transaction) => {
          await transaction.insert(user).values({
            id: userId,
            name: "Failure",
            lastName: "Test",
            email: `${userId}@test.com`,
            role: "volunteer",
            status: "active",
          });
          await jobService.run(
            "jobs.integration-test",
            { message: "not queued" },
            { transaction },
          );
        }),
      ).rejects.toThrow("enqueue unavailable");
      expect(
        await getTestDb().select().from(user).where(eq(user.id, userId)),
      ).toHaveLength(0);
    });

    it("uses native job IDs for idempotent enqueueing", async () => {
      await jobService.start();
      await getTestDb().transaction(async (transaction) => {
        const options = {
          transaction,
          idempotencyKey: "same-event",
          startAfter: 3600,
        };
        expect(
          await jobService.run(
            "jobs.integration-test",
            { message: "first" },
            options,
          ),
        ).toBeTypeOf("string");
        expect(
          await jobService.run(
            "jobs.integration-test",
            { message: "duplicate" },
            options,
          ),
        ).toBeNull();
      });
      expect(
        await jobService.run(
          "jobs.integration-test",
          { message: "retry" },
          { idempotencyKey: "same-event", startAfter: 3600 },
        ),
      ).toBeNull();
      expect(await boss().findJobs("jobs.integration-test")).toHaveLength(1);
    });

    it("atomically cancels superseded jobs and enqueues a replacement (array parameters)", async () => {
      await jobService.start();
      const options = { singletonKey: "assignment", startAfter: 3600 };
      const first = await jobService.run(
        "jobs.integration-test",
        { message: "old1" },
        options,
      );
      const second = await jobService.run(
        "jobs.integration-test",
        { message: "old2" },
        options,
      );
      const replacement = await getTestDb().transaction((transaction) =>
        jobService.run(
          "jobs.integration-test",
          { message: "latest" },
          { ...options, transaction, replacePending: true },
        ),
      );
      const jobs = await boss().findJobs("jobs.integration-test", {
        key: "assignment",
      });
      expect(jobs.find((job) => job.id === first)?.state).toBe("cancelled");
      expect(jobs.find((job) => job.id === second)?.state).toBe("cancelled");
      expect(jobs.find((job) => job.id === replacement)?.state).toBe("created");
    });

    it("rolls back cancellation and replacement together", async () => {
      await jobService.start();
      const options = { singletonKey: "assignment", startAfter: 3600 };
      const original = await jobService.run(
        "jobs.integration-test",
        { message: "original" },
        options,
      );
      let replacement: string | null = null;
      await expect(
        getTestDb().transaction(async (transaction) => {
          replacement = await jobService.run(
            "jobs.integration-test",
            { message: "rolled back" },
            { ...options, transaction, replacePending: true },
          );
          throw new Error("rollback");
        }),
      ).rejects.toThrow("rollback");
      expect(
        (await boss().findJobs("jobs.integration-test", { id: original! }))[0]
          ?.state,
      ).toBe("created");
      expect(
        await boss().findJobs("jobs.integration-test", { id: replacement! }),
      ).toHaveLength(0);
    });

    it("rolls back replacement when pg-boss rejects a native option", async () => {
      const options = { singletonKey: "invalid-retry", startAfter: 3600 };
      const original = await jobService.run(
        "jobs.integration-test",
        {},
        options,
      );
      await expect(
        getTestDb().transaction((transaction) =>
          jobService.run(
            "jobs.integration-test",
            {},
            {
              ...options,
              transaction,
              replacePending: true,
              retryLimit: -1,
            },
          ),
        ),
      ).rejects.toThrow("retryLimit must be an integer >= 0");
      const jobs = await boss().findJobs("jobs.integration-test", {
        key: options.singletonKey,
      });
      expect(jobs).toHaveLength(1);
      expect(jobs[0]).toMatchObject({ id: original, state: "created" });
    });

    it("supports native cancellation inside an application transaction", async () => {
      await jobService.start();
      const id = await jobService.run(
        "jobs.integration-test",
        { message: "cancel me" },
        { singletonKey: "hidden", startAfter: 3600 },
      );
      await getTestDb().transaction((transaction) =>
        jobService.cancelPending("jobs.integration-test", "hidden", {
          transaction,
        }),
      );
      expect(
        (await boss().findJobs("jobs.integration-test", { id: id! }))[0]?.state,
      ).toBe("cancelled");
    });

    it("cancels a retry reinserted while native cancellation waits on its old row", async () => {
      await jobService.start();
      await boss().offWork("jobs.integration-test");
      const id = await jobService.run(
        "jobs.integration-test",
        { message: "retry race" },
        { singletonKey: "retry-race", retryLimit: 3, retryDelay: 3600 },
      );
      expect((await boss().fetch("jobs.integration-test"))[0]?.id).toBe(id);
      const cancel = vi.spyOn(boss(), "cancel");

      const connection = postgres(testEnv.DATABASE_URL, { max: 3 });
      let release!: () => void;
      let failed!: () => void;
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      const ready = new Promise<void>((resolve) => {
        failed = resolve;
      });
      const failure = connection.begin(async (tx) => {
        await boss().fail(
          "jobs.integration-test",
          id!,
          {},
          {
            db: {
              executeSql: async (text, values = []) => ({
                rows: Array.from(
                  await tx.unsafe(
                    text,
                    values as Parameters<typeof tx.unsafe>[1],
                  ),
                ),
              }),
            },
          },
        );
        failed();
        await gate;
      });
      let cancellation: Promise<void> | undefined;
      try {
        await ready;
        cancellation = getTestDb().transaction((transaction) =>
          jobService.cancelPending("jobs.integration-test", "retry-race", {
            transaction,
          }),
        );
        await vi.waitFor(async () => {
          const [row] = await connection`
            SELECT count(*)::int AS waiting FROM pg_stat_activity
            WHERE datname = current_database() AND wait_event_type = 'Lock'
              AND query LIKE '%completed_on = now()%'
          `;
          expect(row!.waiting).toBeGreaterThan(0);
        });
        release();
        await failure;
        await cancellation;
        const [current] = await boss().findJobs("jobs.integration-test", {
          id: id!,
        });
        expect(current?.state).toBe("cancelled");
        expect(cancel).toHaveBeenCalledTimes(2);
      } finally {
        release();
        await Promise.allSettled([failure, cancellation]);
        await connection.end();
      }
    });

    it("serializes concurrent replacements and keyed enqueues until transaction commit", async () => {
      await jobService.start();
      const connection = postgres(testEnv.DATABASE_URL, { max: 3 });
      const db = drizzle(connection, { schema });
      let release!: () => void;
      let enqueued!: () => void;
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      const ready = new Promise<void>((resolve) => {
        enqueued = resolve;
      });
      const options = { singletonKey: "concurrent", startAfter: 3600 };
      const first = getTestDb().transaction(async (transaction) => {
        const id = await jobService.run(
          "jobs.integration-test",
          { message: "first" },
          { ...options, transaction },
        );
        enqueued();
        await gate;
        return id;
      });
      let replacement: Promise<string | null> | undefined;
      try {
        await ready;
        replacement = db.transaction((transaction) =>
          jobService.run(
            "jobs.integration-test",
            { message: "latest" },
            { ...options, transaction, replacePending: true },
          ),
        );
        await vi.waitFor(async () => {
          const [row] = await connection`
            SELECT count(*)::int AS waiting FROM pg_stat_activity
            WHERE datname = current_database() AND wait_event = 'advisory'
          `;
          expect(row!.waiting).toBeGreaterThan(0);
        });
        // Other keys can still progress while the same-key producer waits.
        await db.transaction((transaction) =>
          jobService.run(
            "jobs.integration-test",
            {},
            { transaction, singletonKey: "independent", startAfter: 3600 },
          ),
        );
        release();
        const [originalId, latestId] = await Promise.all([first, replacement]);
        const jobs = await boss().findJobs("jobs.integration-test", {
          key: options.singletonKey,
        });
        expect(jobs.find((job) => job.id === originalId)?.state).toBe(
          "cancelled",
        );
        expect(jobs.find((job) => job.id === latestId)?.state).toBe("created");
      } finally {
        release();
        await Promise.allSettled([first, replacement]);
        await connection.end();
      }
    });

    it("aborts replacement if native cancellation cannot settle", async () => {
      await jobService.start();
      const id = await jobService.run(
        "jobs.integration-test",
        {},
        {
          singletonKey: "unsettled",
          startAfter: 3600,
        },
      );
      const cancel = vi.spyOn(boss(), "cancel").mockResolvedValue({});
      await expect(
        getTestDb().transaction((transaction) =>
          jobService.run(
            "jobs.integration-test",
            {},
            { transaction, singletonKey: "unsettled", replacePending: true },
          ),
        ),
      ).rejects.toThrow("retry transaction");
      expect(cancel).toHaveBeenCalledTimes(3);
      const jobs = await boss().findJobs("jobs.integration-test", {
        key: "unsettled",
      });
      expect(jobs).toHaveLength(1);
      expect(jobs[0]).toMatchObject({ id, state: "created" });
    });

    it("rejects unsafe replacement options through the startup scheduling path", async () => {
      await jobService.start();
      const cancel = vi.spyOn(boss(), "cancel");
      // Simulate a malformed persisted/runtime definition despite the static type.
      testJob.startup = {
        options: { replacePending: true },
      } as unknown as NonNullable<typeof testJob.startup>;
      try {
        await expect(
          (
            jobService as unknown as {
              registerStartupSchedules(): Promise<void>;
            }
          ).registerStartupSchedules(),
        ).rejects.toThrow("requires a transaction");
        expect(cancel).not.toHaveBeenCalled();
      } finally {
        delete testJob.startup;
      }
    });

    it("guards cancellation against an empty key or missing transaction at runtime", async () => {
      await jobService.start();
      const find = vi.spyOn(boss(), "findJobs");
      const cancel = vi.spyOn(boss(), "cancel");
      for (const key of ["", "  "]) {
        await expect(
          getTestDb().transaction((transaction) =>
            jobService.cancelPending("jobs.integration-test", key, {
              transaction,
            }),
          ),
        ).rejects.toThrow("requires a transaction and singletonKey");
      }
      await expect(
        jobService.cancelPending("jobs.integration-test", "key", {
          // Exercise the safety boundary even if a caller bypasses TypeScript.
          transaction: undefined as unknown as Transaction,
        }),
      ).rejects.toThrow("requires a transaction and singletonKey");
      expect(find).not.toHaveBeenCalled();
      expect(cancel).not.toHaveBeenCalled();
    });

    it("lets a running handler detect native cancellation before its side effect", async () => {
      let entered = false;
      let observed: boolean | undefined;
      let release!: () => void;
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      vi.spyOn(testJob, "handler").mockImplementationOnce(
        async (_payload, context) => {
          entered = true;
          await gate;
          observed = await context.isCancelled?.();
        },
      );
      try {
        await jobService.run(
          "jobs.integration-test",
          { message: "old" },
          { singletonKey: "active" },
        );
        await vi.waitFor(() => expect(entered).toBe(true), { timeout: 10_000 });
        await getTestDb().transaction((transaction) =>
          jobService.run(
            "jobs.integration-test",
            { message: "latest" },
            { transaction, singletonKey: "active", replacePending: true },
          ),
        );
        release();
        await vi.waitFor(() => expect(observed).toBe(true), {
          timeout: 10_000,
        });
        await waitForHandlerCalls();
        expect(handlerCalls[0]?.payload.message).toBe("latest");
      } finally {
        release();
      }
    });
  });

  describe("transactional email producers", () => {
    it("rolls back account approval if pg-boss enqueue fails", async () => {
      await jobService.start();
      const id = randomUUID();
      await getTestDb()
        .insert(user)
        .values({
          id,
          name: "Approval",
          lastName: "Test",
          email: `${id}@test.com`,
          role: "volunteer",
          status: "unverified",
        });
      const service = new UserService({
        db: getTestDb(),
        jobService: jobService as unknown as IJobService,
      });
      try {
        vi.spyOn(boss(), "send").mockRejectedValueOnce(
          new Error("queue unavailable"),
        );
        await expect(service.verifyVolunteer(id)).rejects.toThrow(
          "queue unavailable",
        );
        expect(
          (await getTestDb().select().from(user).where(eq(user.id, id)))[0]
            ?.status,
        ).toBe("unverified");
        expect(await boss().findJobs("jobs.send-email")).toHaveLength(0);
      } finally {
        await getTestDb().delete(user).where(eq(user.id, id));
      }
    });

    it("serializes duplicate account transitions before enqueueing", async () => {
      await jobService.start();
      const id = randomUUID();
      await getTestDb()
        .insert(user)
        .values({
          id,
          name: "Concurrent",
          lastName: "Test",
          email: `${id}@test.com`,
          role: "volunteer",
          status: "unverified",
        });
      const { default: postgres } = await import("postgres");
      const { drizzle } = await import("drizzle-orm/postgres-js");
      const schema = await import("@/server/db/schema");
      const connection = postgres(env.DATABASE_URL, { max: 4 });
      const service = new UserService({
        db: drizzle(connection, { schema }),
        jobService: jobService as unknown as IJobService,
      });
      try {
        await Promise.all([
          service.verifyVolunteer(id),
          service.verifyVolunteer(id),
        ]);
        expect(await boss().findJobs("jobs.send-email")).toHaveLength(1);
        const results = await Promise.allSettled([
          service.deactivateUser(id),
          service.deactivateUser(id),
        ]);
        expect(
          results.filter((result) => result.status === "fulfilled"),
        ).toHaveLength(1);
        expect(await boss().findJobs("jobs.send-email")).toHaveLength(2);
      } finally {
        await connection.end();
        await getTestDb().delete(user).where(eq(user.id, id));
      }
    });

    it("commits notification fan-out atomically and deduplicates retries with native job IDs", async () => {
      await jobService.start();
      const id = randomUUID();
      await getTestDb()
        .insert(user)
        .values({
          id,
          name: "Fanout",
          lastName: "Test",
          email: `${id}@test.com`,
          role: "volunteer",
          status: "active",
        });
      const preferences = new MockPreferenceService();
      vi.spyOn(preferences, "getPreferencesForRecipients").mockResolvedValue(
        new Map([
          [
            id,
            new Map([
              ["in_app", true],
              ["email", true],
            ]),
          ],
        ]),
      );
      const service = new NotificationService({
        db: getTestDb(),
        jobService: jobService as unknown as IJobService,
        preferenceService: preferences,
      });
      const params = {
        type: "shift.cancelled",
        audience: { kind: "user" as const, userId: id },
        context: {
          shiftId: randomUUID(),
          className: "Class",
          shiftDate: "Jul 15",
          cancelReason: "Test",
          cancelledByName: "Admin",
        },
        idempotencyKey: randomUUID(),
      };
      try {
        vi.spyOn(boss(), "send").mockRejectedValueOnce(
          new Error("queue unavailable"),
        );
        await expect(service.processNotification(params)).rejects.toThrow(
          "queue unavailable",
        );
        expect(
          await getTestDb()
            .select()
            .from(notification)
            .where(eq(notification.userId, id)),
        ).toHaveLength(0);
        await service.processNotification(params);
        await service.processNotification(params);
        expect(
          await getTestDb()
            .select()
            .from(notification)
            .where(eq(notification.userId, id)),
        ).toHaveLength(1);
        expect(await boss().findJobs("jobs.send-email")).toHaveLength(1);
      } finally {
        await getTestDb().delete(user).where(eq(user.id, id));
      }
    });
  });

  // Start / stop lifecycle

  describe("start/stop lifecycle", () => {
    it("starts pg-boss and becomes operational", async () => {
      await jobService.start();
      const id = await jobService.run("jobs.integration-test", {
        message: "hello",
      });
      expect(id).toBeTypeOf("string");
    });

    it("stop resets all global state", async () => {
      await jobService.start();
      await jobService.stop();

      const state = (globalThis as any).__neuronPgBossState;
      expect(state.isStarted).toBe(false);
      expect(state.isWorkersRegistered).toBe(false);
      expect(state.boss).toBeUndefined();
      expect(state.startPromise).toBeUndefined();
    });

    it("multiple concurrent start calls are idempotent", async () => {
      await Promise.all([
        jobService.start(),
        jobService.start(),
        jobService.start(),
      ]);
      // Should not throw — only one bootstrap runs
      const id = await jobService.run("jobs.integration-test", {
        message: "concurrent",
      });
      expect(id).toBeTypeOf("string");
    });

    it("restart after stop works", async () => {
      await jobService.start();
      await jobService.stop();

      // Need a fresh instance after stop since boss reference is cleared
      jobService = new JobService({
        container: container as any,
        env: testEnv,
      }) as unknown as TestableJobService;
      await jobService.start();

      const id = await jobService.run("jobs.integration-test", {
        message: "restarted",
      });
      expect(id).toBeTypeOf("string");
    });
  });

  describe("run - one-off jobs", () => {
    it("returns a job ID string", async () => {
      const id = await jobService.run("jobs.integration-test", {
        message: "one-off",
      });
      expect(id).toBeTypeOf("string");
      expect(id).toBeTruthy();
    });

    it("sends job with payload data", async () => {
      const id = await jobService.run("jobs.integration-test", {
        message: "with-payload",
      });
      expect(id).toBeTruthy();
    });

    it("sends job with startAfter delay", async () => {
      const id = await jobService.run(
        "jobs.integration-test",
        { message: "delayed" },
        { startAfter: 3600 },
      );
      expect(id).toBeTypeOf("string");
    });

    it("sends job with runAt option", async () => {
      const future = new Date(Date.now() + 60_000);
      const id = await jobService.run(
        "jobs.integration-test",
        { message: "scheduled" },
        { runAt: future },
      );
      expect(id).toBeTypeOf("string");
    });
  });

  describe("run - recurring (cron) jobs", () => {
    it("schedules cron job and returns null", async () => {
      const result = await jobService.run(
        "jobs.integration-test",
        { message: "cron" },
        { cron: "0 * * * *" },
      );
      expect(result).toBeNull();
    });

    it("schedules cron job with correlationId", async () => {
      const result = await jobService.run(
        "jobs.integration-test",
        { message: "cron-corr" },
        { cron: "0 * * * *", correlationId: "tenant-1" },
      );
      expect(result).toBeNull();
    });
  });

  describe("unschedule", () => {
    it("unschedules a previously scheduled cron job by name", async () => {
      await jobService.run(
        "jobs.integration-test",
        { message: "to-unsched" },
        { cron: "0 * * * *" },
      );

      await expect(
        jobService.unschedule("jobs.integration-test"),
      ).resolves.toBeUndefined();
    });

    it("unschedules by correlationId", async () => {
      await jobService.run(
        "jobs.integration-test",
        { message: "corr-unsched" },
        { cron: "0 * * * *", correlationId: "tenant-2" },
      );

      await expect(
        jobService.unschedule("jobs.integration-test", {
          correlationId: "tenant-2",
        }),
      ).resolves.toBeUndefined();
    });

    it("throws for unknown job name", async () => {
      await expect(jobService.unschedule("jobs.nonexistent")).rejects.toThrow(
        "Unknown job name",
      );
    });
  });

  describe("worker execution", () => {
    it("handler receives correct payload", async () => {
      await jobService.start();
      await jobService.run("jobs.integration-test", {
        message: "test-payload",
      });

      await waitForHandlerCalls(1);

      expect(handlerCalls).toHaveLength(1);
      expect(handlerCalls[0]!.payload).toEqual({ message: "test-payload" });
    });

    it("handler receives scoped DI container", async () => {
      await jobService.start();
      await jobService.run("jobs.integration-test", {
        message: "di-check",
      });

      await waitForHandlerCalls(1);

      expect(handlerCalls[0]!.context).toHaveProperty("container");
      expect(handlerCalls[0]!.context).toHaveProperty("cradle");
    });
  });

  describe("error handling", () => {
    it("throws for unknown job name on run()", async () => {
      await expect(jobService.run("jobs.does-not-exist")).rejects.toThrow(
        "Unknown job name",
      );
    });

    it("throws for unknown job name on unschedule()", async () => {
      await expect(
        jobService.unschedule("jobs.does-not-exist"),
      ).rejects.toThrow("Unknown job name");
    });
  });
});
