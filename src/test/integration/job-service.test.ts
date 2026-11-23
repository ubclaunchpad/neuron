import { UserService } from "@/server/services/entity/userService";
import { NotificationService } from "@/server/services/notificationService";
import type { IJobService } from "@/server/services/jobService";
import { MockPreferenceService } from "../mocks/mock-notification-services";
import { notification } from "@/server/db/schema";
import { randomUUID } from "crypto";
import { user } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import type { PgBoss } from "pg-boss";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
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

    it("rejects transactional cron and replacement without a transaction", async () => {
      await getTestDb().transaction(async (transaction) => {
        await expect(
          jobService.run(
            "jobs.integration-test",
            {},
            { transaction, cron: "* * * * *" },
          ),
        ).rejects.toThrow("one-off");
      });
      await expect(
        jobService.run(
          "jobs.integration-test",
          {},
          { replacePending: true, singletonKey: "key" },
        ),
      ).rejects.toThrow("transaction");
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

    it("rejects when both runAt and startAfter are provided", async () => {
      await expect(
        jobService.run(
          "jobs.integration-test",
          { message: "both" },
          { runAt: new Date(), startAfter: 30 },
        ),
      ).rejects.toThrow("Provide either runAt or startAfter, not both");
    });

    it("rejects correlationId without cron", async () => {
      await expect(
        jobService.run(
          "jobs.integration-test",
          { message: "corr" },
          { correlationId: "abc" },
        ),
      ).rejects.toThrow("correlationId is only supported for recurring");
    });

    it("rejects startAt without cron", async () => {
      await expect(
        jobService.run(
          "jobs.integration-test",
          { message: "startAt" },
          { startAt: new Date() },
        ),
      ).rejects.toThrow("startAt/endAt require cron");
    });

    it("rejects endAt without cron", async () => {
      await expect(
        jobService.run(
          "jobs.integration-test",
          { message: "endAt" },
          { endAt: new Date() },
        ),
      ).rejects.toThrow("startAt/endAt require cron");
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

    it("rejects cron with runAt", async () => {
      await expect(
        jobService.run(
          "jobs.integration-test",
          { message: "bad" },
          { cron: "* * * * *", runAt: new Date() },
        ),
      ).rejects.toThrow("Recurring runs cannot include runAt/startAfter");
    });

    it("rejects cron with startAfter", async () => {
      await expect(
        jobService.run(
          "jobs.integration-test",
          { message: "bad" },
          { cron: "* * * * *", startAfter: 30 },
        ),
      ).rejects.toThrow("Recurring runs cannot include runAt/startAfter");
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
