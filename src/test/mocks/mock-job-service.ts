import type {
  IJobService,
} from "@/server/services/jobService";
import type { JobPayload, KnownJobName } from "@/server/jobs/registry";
import type {
  RunJobOptions,
} from "@/server/jobs/types";

export class MockJobService implements IJobService {
  readonly calls: {
    jobName: KnownJobName;
    data?: unknown;
    options?: RunJobOptions;
  }[] = [];

  async start(): Promise<void> {}

  async stop(): Promise<void> {}

  async run<TJobName extends KnownJobName>(
    jobName: TJobName,
    data?: JobPayload<TJobName>,
    options?: RunJobOptions,
  ): Promise<string | null> {
    this.calls.push({ jobName, data, options });
    if (options?.cron) return null;
    return "mock-job-id";
  }

  async unschedule(
    _jobName: KnownJobName,
    _options?: { correlationId?: string },
  ): Promise<void> {}
}
