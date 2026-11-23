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
  unschedule(
    jobName: string,
    options?: { correlationId?: string },
  ): Promise<void>;
}

// Test job definitions (hoisted for vi.mock)

type TestPayload = { message: string };

const { testJob, failingJob, handlerCalls } = vi.hoisted(() => {
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

  return { testJob, failingJob, handlerCalls };
});

// Mock the job registry so JobService sees our test jobs

vi.mock("@/server/jobs/registry", () => {
  const jobs = [testJob, failingJob];
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
    try {
      await jobService.stop();
    } catch {
      // Ignore stop errors during cleanup
    }

    const db = getTestDb();
    await db.execute(sql`DROP SCHEMA IF EXISTS pgboss CASCADE`);
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

    it("multiple concurrent first sends on a cold service all await full initialization", async () => {
      const results = await Promise.all([
        jobService.run("jobs.integration-test", { message: "cold-1" }),
        jobService.run("jobs.integration-test", { message: "cold-2" }),
        jobService.run("jobs.integration-test", { message: "cold-3" }),
      ]);

      expect(results).toHaveLength(3);
      for (const id of results) {
        expect(id).toBeTypeOf("string");
        expect(id).toBeTruthy();
      }

      await waitForHandlerCalls(3);
      expect(handlerCalls.map((call) => call.payload.message).sort()).toEqual([
        "cold-1",
        "cold-2",
        "cold-3",
      ]);
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

    it("recovers pending delayed jobs after an idle restart without user traffic", async () => {
      await jobService.run(
        "jobs.integration-test",
        { message: "reminder-pending-across-restart" },
        { startAfter: 2 },
      );

      // Shut down before the delayed job becomes eligible
      await jobService.stop();
      expect(handlerCalls).toHaveLength(0);

      // Cold/idle restart: only start() runs, no user request calls run()
      jobService = new JobService({
        container: container as any,
        env: testEnv,
      }) as unknown as TestableJobService;
      await jobService.start();

      await waitForHandlerCalls(1);
      expect(handlerCalls).toHaveLength(1);
      expect(handlerCalls[0]!.payload).toEqual({
        message: "reminder-pending-across-restart",
      });
    });

    it("recovers persisted regular and correlated schedules after an idle restart", async () => {
      // Schedule a regular recurring job and two correlated recurring jobs
      await jobService.run(
        "jobs.integration-test",
        { message: "regular-cron" },
        { cron: "0 * * * *" },
      );
      await jobService.run(
        "jobs.integration-test",
        { message: "corr-a" },
        { cron: "0 * * * *", correlationId: "tenant-a" },
      );
      await jobService.run(
        "jobs.integration-test",
        { message: "corr-b" },
        { cron: "0 * * * *", correlationId: "tenant-b" },
      );

      // Simulate process shutdown (clears all in-memory worker & queue tracking state)
      await jobService.stop();

      // Simulate cold/idle restart: only start() is called, no user request calls run()
      jobService = new JobService({
        container: container as any,
        env: testEnv,
      }) as unknown as TestableJobService;
      await jobService.start();

      const state = (
        globalThis as unknown as {
          __neuronPgBossState: {
            boss: {
              send: (name: string, data: unknown) => Promise<string | null>;
              getSchedules: () => Promise<{ name: string }[]>;
            };
            registeredWorkerQueues: Set<string>;
            recurringQueuesByJob: Map<string, Set<string>>;
          };
        }
      ).__neuronPgBossState;

      // Both regular and correlated workers must have been recovered without traffic
      expect(state.registeredWorkerQueues.has("jobs.integration-test")).toBe(
        true,
      );
      expect(
        state.registeredWorkerQueues.has("jobs.integration-test/tenant-a"),
      ).toBe(true);
      expect(
        state.registeredWorkerQueues.has("jobs.integration-test/tenant-b"),
      ).toBe(true);

      // Jobs dispatched by pg-boss timekeeper to both regular and correlated queues execute
      await state.boss.send("jobs.integration-test", {
        message: "from-regular-after-restart",
      });
      await state.boss.send("jobs.integration-test/tenant-a", {
        message: "from-correlated-after-restart",
      });

      await waitForHandlerCalls(2);
      expect(handlerCalls.map((call) => call.payload.message).sort()).toEqual([
        "from-correlated-after-restart",
        "from-regular-after-restart",
      ]);

      // Targeted unschedule removes only tenant-a after restart
      await jobService.unschedule("jobs.integration-test", {
        correlationId: "tenant-a",
      });
      const remainingAfterTargeted = (await state.boss.getSchedules()).map(
        (s) => s.name,
      );
      expect(remainingAfterTargeted).not.toContain(
        "jobs.integration-test/tenant-a",
      );
      expect(remainingAfterTargeted).toContain("jobs.integration-test");
      expect(remainingAfterTargeted).toContain(
        "jobs.integration-test/tenant-b",
      );

      // Bulk unschedule removes all remaining regular and correlated schedules after restart
      await jobService.unschedule("jobs.integration-test");
      const remainingAfterBulk = (await state.boss.getSchedules()).map(
        (s) => s.name,
      );
      expect(remainingAfterBulk).not.toContain("jobs.integration-test");
      expect(remainingAfterBulk).not.toContain(
        "jobs.integration-test/tenant-b",
      );
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
