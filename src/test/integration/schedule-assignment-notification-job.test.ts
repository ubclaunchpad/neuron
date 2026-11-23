import { randomUUID } from "crypto";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "@/server/db/schema";
import { env } from "@/env";
import { sendEmailJob } from "@/server/jobs/definitions/send-email.job";
import { Temporal } from "@js-temporal/polyfill";
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  course,
  term,
  user,
  volunteer,
  volunteerToSchedule,
  deliveryOutbox as outbox,
} from "@/server/db/schema";
import { processDeliveryOutboxJob as job } from "@/server/jobs/definitions/process-delivery-outbox.job";
import type { IClassService } from "@/server/services/entity/classService";
import type { ITermService } from "@/server/services/entity/termService";
import type { MockEmailService } from "../mocks/mock-email-service";
import type { MockJobService } from "../mocks/mock-job-service";
import {
  createTestScope,
  type ITestServiceScope,
} from "../helpers/test-service-scope";

describe("durable schedule assignment delivery", () => {
  let scope: ITestServiceScope;
  let classes: IClassService;
  let terms: ITermService;
  let mail: MockEmailService;
  let volunteerId: string;
  let termId: string;
  let classId: string;
  let scheduleId: string;
  const year = new Date().getUTCFullYear() + 1;

  beforeEach(async () => {
    scope = createTestScope();
    scope.mockSession.setAsAdmin();
    classes = scope.resolve("classService");
    terms = scope.resolve("termService");
    mail = scope.resolve("emailService");
    volunteerId = randomUUID();
    await scope.db.insert(user).values({
      id: volunteerId,
      name: "Target",
      lastName: "Volunteer",
      email: `${volunteerId}@test.com`,
      role: "volunteer",
      status: "active",
      emailVerified: true,
    });
    await scope.db.insert(volunteer).values({ userId: volunteerId });
    termId = await terms.createTerm({
      name: `Assignment ${randomUUID()}`,
      startDate: `${year}-06-01`,
      endDate: `${year}-08-31`,
      holidays: [],
    });
    classId = await classes.createClass({
      termId,
      name: "Assignment class",
      category: "literacy",
      schedules: [
        {
          localStartTime: Temporal.PlainTime.from("10:00"),
          localEndTime: Temporal.PlainTime.from("11:00"),
          volunteerUserIds: [],
          instructorUserIds: [],
          preferredVolunteerCount: 2,
          rule: { type: "single", extraDates: [`${year}-07-15`] },
        },
      ],
    });
    scheduleId = (await classes.getClass(classId)).schedules[0]!.id;
    await classes.publishClass(classId);
    await terms.publishTerm(termId);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await scope.db
      .delete(outbox)
      .where(
        eq(
          outbox.deliveryKey,
          `schedule-assignment:${scheduleId}:${volunteerId}`,
        ),
      );
    await scope.db.delete(course).where(eq(course.id, classId));
    await scope.db.delete(term).where(eq(term.id, termId));
    await scope.db.delete(user).where(eq(user.id, volunteerId));
    scope.dispose();
  });

  const update = (added: string[], removed: string[]) =>
    classes.updateClass({
      id: classId,
      addedSchedules: [],
      deletedSchedules: [],
      updatedSchedules: [
        {
          id: scheduleId,
          addedVolunteerUserIds: added,
          removedVolunteerUserIds: removed,
          addedInstructorUserIds: [],
          removedInstructorUserIds: [],
        },
      ],
    });
  const drain = () =>
    job.handler(
      {},
      { container: scope.container, cradle: scope.container.cradle },
    );
  const intents = () =>
    scope.db
      .select()
      .from(outbox)
      .where(
        eq(
          outbox.deliveryKey,
          `schedule-assignment:${scheduleId}:${volunteerId}`,
        ),
      );
  const retryNow = () =>
    scope.db
      .update(outbox)
      .set({ nextAttemptAt: new Date(0) })
      .where(
        eq(
          outbox.deliveryKey,
          `schedule-assignment:${scheduleId}:${volunteerId}`,
        ),
      );

  it("saves notification intent with no dependency on a running queue", async () => {
    const queue = scope.resolve<MockJobService>("jobService");
    vi.spyOn(queue, "run").mockRejectedValue(new Error("queue unavailable"));
    await expect(update([volunteerId], [])).resolves.toBeUndefined();
    expect(await intents()).toHaveLength(1);
    expect(queue.run).not.toHaveBeenCalled();
    await drain();
    expect(mail.sentEmails).toHaveLength(1);
    expect(mail.sentEmails[0]).toMatchObject({
      to: `${volunteerId}@test.com`,
      text: expect.stringContaining("Jul 15"),
      html: expect.stringContaining('href="http://localhost:3000/schedule"'),
    });
    expect((await intents())[0]?.processedAt).toBeInstanceOf(Date);
  });

  it("rolls back assignment changes if recording notification intent fails", async () => {
    vi.spyOn(
      classes as unknown as { recordScheduleAssignments: () => Promise<void> },
      "recordScheduleAssignments",
    ).mockRejectedValueOnce(new Error("outbox write failed"));
    await expect(update([volunteerId], [])).rejects.toThrow(
      "outbox write failed",
    );
    expect(
      await scope.db
        .select()
        .from(volunteerToSchedule)
        .where(eq(volunteerToSchedule.scheduleId, scheduleId)),
    ).toHaveLength(0);
    expect(await intents()).toHaveLength(0);
  });

  it("accepts an omitted payload serialized as null by JobService", async () => {
    await update([volunteerId], []);
    await job.handler(null as unknown as Parameters<typeof job.handler>[0], {
      container: scope.container,
      cradle: scope.container.cradle,
    });
    expect(mail.sentEmails).toHaveLength(1);
  });

  it("does not log authentication links from generic emails", async () => {
    const debug = vi.spyOn(console, "debug");
    await sendEmailJob.handler(
      {
        to: "test@example.com",
        subject: "Reset password",
        text: "Reset",
        html: '<a href="https://example.com/reset/SECRET_TOKEN">Reset</a>',
      },
      { container: scope.container, cradle: scope.container.cradle },
    );
    expect(JSON.stringify(debug.mock.calls)).not.toContain("SECRET_TOKEN");
  });

  it("supersedes add/remove/add and rejects old revision jobs", async () => {
    await update([volunteerId], []);
    await update([], [volunteerId]);
    await update([volunteerId], []);
    // Independent connections exercise row locks, rather than serializing the
    // workers implicitly through the fixture database's single-connection pool.
    const connection = postgres(env.DATABASE_URL, { max: 4 });
    const db = drizzle(connection, { schema });
    const context = {
      container: scope.container,
      cradle: { ...scope.container.cradle, db },
    };
    try {
      await Promise.all([job.handler({}, context), job.handler({}, context)]);
    } finally {
      await connection.end();
    }
    expect(mail.sentEmails).toHaveLength(1);
    await drain();
    expect(mail.sentEmails).toHaveLength(1);
  });

  it("does not resend an unchanged assignment", async () => {
    await update([volunteerId], []);
    await drain();
    await update([volunteerId], []);
    await drain();
    expect(mail.sentEmails).toHaveLength(1);
  });

  it("does not notify about a net-zero insertion and removal", async () => {
    await update([volunteerId], [volunteerId]);
    await drain();
    expect(await intents()).toHaveLength(0);
    expect(mail.sentEmails).toHaveLength(0);
  });

  it("revalidates removal after an SMTP failure instead of sending stale content", async () => {
    await update([volunteerId], []);
    const send = vi
      .spyOn(mail, "send")
      .mockRejectedValueOnce(new Error("SMTP unavailable"));
    await drain();
    expect((await intents())[0]).toMatchObject({
      attempts: 1,
      processedAt: null,
    });
    await update([], [volunteerId]);
    await drain();
    expect(send).toHaveBeenCalledTimes(2);
    expect(mail.sentEmails).toHaveLength(1);
    expect(mail.sentEmails[0]).toMatchObject({
      subject: "Schedule assignment removed: Assignment class",
      text: expect.stringContaining("Removed schedule"),
    });
  });

  it.each(["inactive", "unpublished term", "unpublished class"])(
    "suppresses retry after %s",
    async (state) => {
      await update([volunteerId], []);
      const send = vi
        .spyOn(mail, "send")
        .mockRejectedValueOnce(new Error("SMTP unavailable"));
      await drain();
      if (state === "inactive")
        await scope.db
          .update(user)
          .set({ status: "inactive" })
          .where(eq(user.id, volunteerId));
      if (state === "unpublished term") await terms.unpublishTerm(termId);
      if (state === "unpublished class")
        await scope.db
          .update(course)
          .set({ published: false })
          .where(eq(course.id, classId));
      await retryNow();
      await drain();
      expect(send).toHaveBeenCalledTimes(1);
      expect(mail.sentEmails).toHaveLength(0);
      expect((await intents())[0]?.processedAt).toBeInstanceOf(Date);
    },
  );

  it("does not retroactively notify assignments made before class publication", async () => {
    await scope.db
      .update(course)
      .set({ published: false })
      .where(eq(course.id, classId));
    await update([volunteerId], []);
    await scope.db
      .update(course)
      .set({ published: true })
      .where(eq(course.id, classId));
    await drain();
    expect(await intents()).toHaveLength(0);
    expect(mail.sentEmails).toHaveLength(0);
  });

  it("keeps failed mail durable and retries successfully", async () => {
    await update([volunteerId], []);
    vi.spyOn(mail, "send").mockRejectedValueOnce(
      new Error("temporary failure"),
    );
    await drain();
    expect((await intents())[0]?.processedAt).toBeNull();
    await drain();
    expect(mail.sentEmails).toHaveLength(0);
    await retryNow();
    await drain();
    expect(mail.sentEmails).toHaveLength(1);
  });
});
