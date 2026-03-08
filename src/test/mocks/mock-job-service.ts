import type {
  IJobService,
} from "@/server/services/jobService";
import type { JobPayload, KnownJobName } from "@/server/jobs/registry";
import type {
  RunJobOptions,
} from "@/server/jobs/types";

export class MockJobService implements IJobService {
  async start(): Promise<void> {}

  async stop(): Promise<void> {}

  async run<TJobName extends KnownJobName>(
    _jobName: TJobName,
    _data?: JobPayload<TJobName>,
    _options?: RunJobOptions,
  ): Promise<string | null> {
    return "mock-job-id";
  }

  async unschedule(
    _jobName: KnownJobName,
    _options?: { correlationId?: string },
  ): Promise<void> {}
}
