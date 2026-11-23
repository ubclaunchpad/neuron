import { afterEach, expect, it, vi } from "vitest";
import { startJobsWithRetry } from "@/server/jobs/start-with-retry";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

it("recovers failed worker bootstrap without a new producer request", async () => {
  vi.useFakeTimers();
  vi.spyOn(console, "error").mockImplementation(() => {});
  const start = vi
    .fn()
    .mockRejectedValueOnce(new Error("database unavailable"))
    .mockResolvedValue(undefined);
  const stop = startJobsWithRetry({ start }, 1000);
  await vi.advanceTimersByTimeAsync(0);
  expect(start).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(1000);
  expect(start).toHaveBeenCalledTimes(2);
  await vi.advanceTimersByTimeAsync(10_000);
  expect(start).toHaveBeenCalledTimes(2);
  stop();
});

it("can stop repeated bootstrap retries", async () => {
  vi.useFakeTimers();
  vi.spyOn(console, "error").mockImplementation(() => {});
  const start = vi.fn().mockRejectedValue(new Error("database unavailable"));
  const stop = startJobsWithRetry({ start }, 1000);
  await vi.advanceTimersByTimeAsync(2000);
  expect(start).toHaveBeenCalledTimes(3);
  stop();
  await vi.advanceTimersByTimeAsync(5000);
  expect(start).toHaveBeenCalledTimes(3);
});
