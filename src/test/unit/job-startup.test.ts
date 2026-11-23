import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createContainer } from "awilix";
import { env } from "@/env";
import { JobService } from "@/server/services/jobService";
import type { NeuronContainer } from "@/server/api/di-container";

let jobs: JobService;
beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(console, "error").mockImplementation(() => {});
  jobs = new JobService({
    container: createContainer() as NeuronContainer,
    env,
  });
});
afterEach(async () => {
  await jobs.stop();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

it("recovers failed bootstrap without a producer request", async () => {
  const bootstrap = vi
    .spyOn(jobs as unknown as { bootstrap: () => Promise<void> }, "bootstrap")
    .mockRejectedValueOnce(new Error("database unavailable"))
    .mockResolvedValue(undefined);
  await expect(jobs.start()).rejects.toThrow("database unavailable");
  await vi.advanceTimersByTimeAsync(30_000);
  expect(bootstrap).toHaveBeenCalledTimes(2);
  await vi.advanceTimersByTimeAsync(60_000);
  expect(bootstrap).toHaveBeenCalledTimes(2);
});

it("stop cancels armed startup retries", async () => {
  const bootstrap = vi
    .spyOn(jobs as unknown as { bootstrap: () => Promise<void> }, "bootstrap")
    .mockRejectedValue(new Error("database unavailable"));
  await expect(jobs.start()).rejects.toThrow();
  await jobs.stop();
  await vi.advanceTimersByTimeAsync(90_000);
  expect(bootstrap).toHaveBeenCalledTimes(1);
});

it("successful manual startup cancels an earlier retry", async () => {
  const bootstrap = vi
    .spyOn(jobs as unknown as { bootstrap: () => Promise<void> }, "bootstrap")
    .mockRejectedValueOnce(new Error("database unavailable"))
    .mockResolvedValue(undefined);
  await expect(jobs.start()).rejects.toThrow();
  await jobs.start();
  await vi.advanceTimersByTimeAsync(30_000);
  expect(bootstrap).toHaveBeenCalledTimes(2);
});
