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

    it("rejects correlationId due to colon separator in queue name (known bug)", async () => {
      // getQueueName() produces "jobs.integration-test:tenant-1" but pg-boss
      // only allows alphanumeric, underscores, hyphens, periods, and slashes.
      // The ":" separator is invalid. This test documents the current behavior.
      await expect(
        jobService.run(
          "jobs.integration-test",
          { message: "cron-corr" },
          { cron: "0 * * * *", correlationId: "tenant-1" },
        ),
      ).rejects.toThrow(/Name can only contain/);
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

    it("unschedules by correlationId (no-ops when schedule does not exist)", async () => {
      // unschedule with correlationId resolves even if the schedule was never
      // created — pg-boss.unschedule does not validate queue name format the
      // same way as getQueue/createQueue.
      await expect(
        jobService.unschedule("jobs.integration-test", {
          correlationId: "tenant-2",
        }),
      ).resolves.toBeUndefined();
    });

    it("throws for unknown job name", async () => {
      await expect(
        jobService.unschedule("jobs.nonexistent"),
      ).rejects.toThrow("Unknown job name");
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
      await expect(
        jobService.run("jobs.does-not-exist"),
      ).rejects.toThrow("Unknown job name");
    });

    it("throws for unknown job name on unschedule()", async () => {
      await expect(
        jobService.unschedule("jobs.does-not-exist"),
      ).rejects.toThrow("Unknown job name");
    });
  });
});
