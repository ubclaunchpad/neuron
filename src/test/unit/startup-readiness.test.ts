import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RegisteredJob } from "@/server/jobs/types";

const mockSentryInit = vi.hoisted(() => vi.fn());
const mockMigrationRunner = vi.hoisted(() => vi.fn());
const mockMigrate = vi.hoisted(() => vi.fn());
const mockJobStart = vi.hoisted(() => vi.fn());
const mockGetRootContainer = vi.hoisted(() => vi.fn());

vi.mock("@sentry/nextjs", () => ({
  init: mockSentryInit,
}));

vi.mock("drizzle-orm/postgres-js/migrator", () => ({
  migrate: mockMigrationRunner,
}));

vi.mock("@/server/db", () => ({
  db: { __mockDb: true },
}));

function createDeferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("migrate()", () => {
  const originalRuntime = process.env.NEXT_RUNTIME;
  const originalPhase = process.env.NEXT_PHASE;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_RUNTIME = "nodejs";
    delete process.env.NEXT_PHASE;
  });

  afterEach(() => {
    if (originalRuntime === undefined) {
      delete process.env.NEXT_RUNTIME;
    } else {
      process.env.NEXT_RUNTIME = originalRuntime;
    }

    if (originalPhase === undefined) {
      delete process.env.NEXT_PHASE;
    } else {
      process.env.NEXT_PHASE = originalPhase;
    }

    vi.restoreAllMocks();
  });

  it("rethrows migration errors instead of swallowing them", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const migrationError = new Error("relation does not exist");
    mockMigrationRunner.mockRejectedValueOnce(migrationError);

    const { migrate } = await import("@/server/db/migrate");
    await expect(migrate()).rejects.toThrow("relation does not exist");

    expect(errorSpy).toHaveBeenCalledWith(
      "Failed to run database migrations",
      migrationError,
    );
    expect(logSpy).toHaveBeenCalledWith("Running migrations...");
  });

  it("skips migrations outside nodejs runtime and during production build", async () => {
    const { migrate } = await import("@/server/db/migrate");

    process.env.NEXT_RUNTIME = "edge";
    await migrate();
    expect(mockMigrationRunner).not.toHaveBeenCalled();

    process.env.NEXT_RUNTIME = "nodejs";
    process.env.NEXT_PHASE = "phase-production-build";
    await migrate();
    expect(mockMigrationRunner).not.toHaveBeenCalled();
  });
});

describe("instrumentation register()", () => {
  const originalRuntime = process.env.NEXT_RUNTIME;
  const originalPhase = process.env.NEXT_PHASE;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.NEXT_RUNTIME = "nodejs";
    delete process.env.NEXT_PHASE;

    vi.doMock("@/server/db/migrate", () => ({
      migrate: mockMigrate,
    }));

    mockGetRootContainer.mockReturnValue({
      cradle: {
        jobService: {
          start: mockJobStart,
        },
      },
    });

    vi.doMock("@/server/api/di-container", () => ({
      getRootContainer: mockGetRootContainer,
    }));
  });

  afterEach(() => {
    if (originalRuntime === undefined) {
      delete process.env.NEXT_RUNTIME;
    } else {
      process.env.NEXT_RUNTIME = originalRuntime;
    }

    if (originalPhase === undefined) {
      delete process.env.NEXT_PHASE;
    } else {
      process.env.NEXT_PHASE = originalPhase;
    }

    vi.doUnmock("@/server/db/migrate");
    vi.doUnmock("@/server/api/di-container");
    vi.restoreAllMocks();
  });

  it("applies migrations and awaits worker startup on cold start without user traffic", async () => {
    const events: string[] = [];
    const workersReady = createDeferred();

    mockMigrate.mockImplementation(async () => {
      events.push("migrate:start");
      events.push("migrate:done");
    });

    mockJobStart.mockImplementation(async () => {
      events.push("workers:start");
      await workersReady.promise;
      events.push("workers:done");
    });

    const { register } = await import("@/instrumentation");

    let registerResolved = false;
    const registerPromise = register().then(() => {
      registerResolved = true;
    });

    await vi.waitFor(() => {
      expect(events).toEqual([
        "migrate:start",
        "migrate:done",
        "workers:start",
      ]);
    });

    expect(registerResolved).toBe(false);
    expect(mockSentryInit).toHaveBeenCalledTimes(1);
    expect(mockGetRootContainer).toHaveBeenCalledTimes(1);

    workersReady.resolve();
    await registerPromise;

    expect(registerResolved).toBe(true);
    expect(events).toEqual([
      "migrate:start",
      "migrate:done",
      "workers:start",
      "workers:done",
    ]);
  });

  it("fails startup and does not start workers when migrations fail", async () => {
    mockMigrate.mockRejectedValueOnce(new Error("migration checksum mismatch"));

    const { register } = await import("@/instrumentation");

    await expect(register()).rejects.toThrow("migration checksum mismatch");
    expect(mockGetRootContainer).not.toHaveBeenCalled();
    expect(mockJobStart).not.toHaveBeenCalled();
  });

  it("fails startup when eager worker bootstrap rejects", async () => {
    mockMigrate.mockResolvedValueOnce(undefined);
    mockJobStart.mockRejectedValueOnce(new Error("pg-boss failed to start"));

    const { register } = await import("@/instrumentation");

    await expect(register()).rejects.toThrow("pg-boss failed to start");
    expect(mockMigrate).toHaveBeenCalledTimes(1);
    expect(mockGetRootContainer).toHaveBeenCalledTimes(1);
  });

  it("skips migrations and worker startup during next build and non-nodejs runtimes", async () => {
    const { register } = await import("@/instrumentation");

    process.env.NEXT_RUNTIME = "edge";
    await register();
    expect(mockSentryInit).not.toHaveBeenCalled();
    expect(mockMigrate).not.toHaveBeenCalled();
    expect(mockGetRootContainer).not.toHaveBeenCalled();

    process.env.NEXT_RUNTIME = "nodejs";
    process.env.NEXT_PHASE = "phase-production-build";
    await register();
    expect(mockSentryInit).toHaveBeenCalledTimes(1);
    expect(mockMigrate).not.toHaveBeenCalled();
    expect(mockGetRootContainer).not.toHaveBeenCalled();
  });
});

describe("JobService startup barrier", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete (globalThis as { __neuronPgBossState?: unknown })
      .__neuronPgBossState;
  });

  afterEach(() => {
    vi.doUnmock("pg-boss");
    vi.doUnmock("@/server/jobs/registry");
    delete (globalThis as { __neuronPgBossState?: unknown })
      .__neuronPgBossState;
    vi.restoreAllMocks();
  });

  it("blocks concurrent sends until queue and worker registration finishes", async () => {
    const events: string[] = [];
    const queueCreationGate = createDeferred();
    let createdQueues = new Set<string>();

    const mockBossInstance = {
      start: vi.fn(async () => {
        events.push("boss.start");
      }),
      stop: vi.fn(async () => {
        events.push("boss.stop");
      }),
      getQueue: vi.fn(async (name: string) =>
        createdQueues.has(name) ? { name } : null,
      ),
      createQueue: vi.fn(async (name: string) => {
        events.push(`createQueue:start:${name}`);
        await queueCreationGate.promise;
        createdQueues.add(name);
        events.push(`createQueue:done:${name}`);
      }),
      updateQueue: vi.fn(async () => {}),
      work: vi.fn(async (name: string) => {
        events.push(`work:${name}`);
      }),
      getSchedules: vi.fn(async () => []),
      send: vi.fn(async (name: string) => {
        if (!createdQueues.has(name)) {
          throw new Error(`Queue ${name} does not exist`);
        }
        events.push(`send:${name}`);
        return `job-${events.length}`;
      }),
      schedule: vi.fn(async () => {}),
      unschedule: vi.fn(async () => {}),
      cancel: vi.fn(async () => {}),
    };

    class MockPgBoss {
      constructor() {
        return mockBossInstance;
      }
    }

    const testJob: RegisteredJob<{ message: string }> = {
      name: "jobs.concurrent-test",
      handler: async () => {},
    };

    vi.doMock("pg-boss", () => ({
      PgBoss: MockPgBoss,
    }));

    vi.doMock("@/server/jobs/registry", () => ({
      registeredJobs: [testJob],
      jobsByName: new Map([[testJob.name, testJob]]),
      isKnownJobName: (name: string) => name === testJob.name,
      isRegisteredJobName: (name: string) => name === testJob.name,
    }));

    const { JobService } = await import("@/server/services/jobService");
    const service = new JobService({
      container: {} as any,
      env: { DATABASE_URL: "postgresql://test", NODE_ENV: "test" } as any,
    });

    const firstStart = service.start();

    await vi.waitFor(() => {
      expect(events).toEqual([
        "boss.start",
        "createQueue:start:jobs.concurrent-test",
      ]);
    });

    const sharedState = (
      globalThis as {
        __neuronPgBossState?: {
          isStarted: boolean;
          startPromise?: Promise<void>;
        };
      }
    ).__neuronPgBossState;

    // Must remain false while queues and workers are still being registered
    expect(sharedState?.isStarted).toBe(false);
    expect(sharedState?.startPromise).toBeDefined();

    // Concurrent callers arriving after boss.start() must still wait for full bootstrap
    const concurrentStart = service.start();
    const concurrentSend1 = service.run(
      "jobs.concurrent-test" as any,
      {
        message: "a",
      } as any,
    );
    const concurrentSend2 = service.run(
      "jobs.concurrent-test" as any,
      {
        message: "b",
      } as any,
    );

    await Promise.resolve();
    await Promise.resolve();
    expect(mockBossInstance.send).not.toHaveBeenCalled();

    queueCreationGate.resolve();

    const [, , jobId1, jobId2] = await Promise.all([
      firstStart,
      concurrentStart,
      concurrentSend1,
      concurrentSend2,
    ]);

    expect(jobId1).toBeTypeOf("string");
    expect(jobId2).toBeTypeOf("string");
    expect(mockBossInstance.start).toHaveBeenCalledTimes(1);
    expect(sharedState?.isStarted).toBe(true);
    expect(sharedState?.startPromise).toBeUndefined();
    expect(events.indexOf("work:jobs.concurrent-test")).toBeLessThan(
      events.indexOf("send:jobs.concurrent-test"),
    );
  });

  it("rolls back state on bootstrap failure and allows subsequent retries", async () => {
    let attempt = 0;
    const stopCalls: number[] = [];

    class FlakyPgBoss {
      private readonly id = ++attempt;

      start = vi.fn(async () => {});
      stop = vi.fn(async () => {
        stopCalls.push(this.id);
      });
      getQueue = vi.fn(async () => null);
      createQueue = vi.fn(async () => {
        if (this.id === 1) {
          throw new Error("queue creation failed");
        }
      });
      updateQueue = vi.fn(async () => {});
      work = vi.fn(async () => {});
      getSchedules = vi.fn(async () => []);
      send = vi.fn(async () => "recovered-job-id");
    }

    const testJob: RegisteredJob<{ message: string }> = {
      name: "jobs.retry-test",
      handler: async () => {},
    };

    vi.doMock("pg-boss", () => ({
      PgBoss: FlakyPgBoss,
    }));

    vi.doMock("@/server/jobs/registry", () => ({
      registeredJobs: [testJob],
      jobsByName: new Map([[testJob.name, testJob]]),
      isKnownJobName: (name: string) => name === testJob.name,
      isRegisteredJobName: (name: string) => name === testJob.name,
    }));

    const { JobService } = await import("@/server/services/jobService");
    const service = new JobService({
      container: {} as any,
      env: { DATABASE_URL: "postgresql://test", NODE_ENV: "test" } as any,
    });

    await expect(
      Promise.all([
        service.start(),
        service.run("jobs.retry-test" as any, { message: "first" } as any),
      ]),
    ).rejects.toThrow("queue creation failed");

    expect(stopCalls).toEqual([1]);

    const jobId = await service.run(
      "jobs.retry-test" as any,
      {
        message: "retry",
      } as any,
    );
    expect(jobId).toBe("recovered-job-id");
    expect(attempt).toBe(2);
  });
});
