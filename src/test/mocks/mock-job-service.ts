import type { IJobService } from "@/server/services/jobService";
import type {
  DeliverableJobName,
  DeliveryPayload,
  JobPayload,
  RunnableJobName,
} from "@/server/jobs/registry";
import type {
  DeliveryOptions,
  JobRuntimeContext,
  RunJobOptions,
} from "@/server/jobs/types";

export class MockJobService implements IJobService {
  readonly calls: {
    jobName: RunnableJobName;
    data?: unknown;
    options?: RunJobOptions;
  }[] = [];
  readonly deliveries: {
    name: DeliverableJobName;
    data: unknown;
    options: DeliveryOptions;
  }[] = [];
  readonly cancellations: { name: DeliverableJobName; key: string }[] = [];
  async start(): Promise<void> {}
  async stop(): Promise<void> {}
  async run<TName extends RunnableJobName>(
    jobName: TName,
    data?: JobPayload<TName>,
    options?: RunJobOptions,
  ): Promise<string | null> {
    this.calls.push({ jobName, data, options });
    return options?.cron ? null : "mock-job-id";
  }
  async deliver<TName extends DeliverableJobName>(
    name: TName,
    data: DeliveryPayload<TName>,
    options: DeliveryOptions,
  ): Promise<void> {
    this.deliveries.push({ name, data, options });
  }
  async cancelDelivery(name: DeliverableJobName, key: string): Promise<void> {
    this.cancellations.push({ name, key });
  }
  async processDeliveryOutbox(_context?: JobRuntimeContext): Promise<void> {}
  async unschedule(
    _name: RunnableJobName,
    _options?: { correlationId?: string },
  ): Promise<void> {}
  async cancelJob(_name: RunnableJobName, _id: string): Promise<void> {}
}
