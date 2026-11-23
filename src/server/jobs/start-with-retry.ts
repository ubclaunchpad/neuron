import type { IJobService } from "@/server/services/jobService";

/** Recover initial worker/cron bootstrap failures without requiring a producer. */
export function startJobsWithRetry(
  jobService: Pick<IJobService, "start">,
  retryDelayMs = 30_000,
) {
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const start = async () => {
    try {
      await jobService.start();
    } catch {
      if (stopped) return;
      console.error("[pg-boss] startup failed; retrying automatically");
      timer = setTimeout(() => {
        void start();
      }, retryDelayMs);
      timer.unref?.();
    }
  };
  void start();
  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
  };
}
