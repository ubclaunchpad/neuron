import { asValue } from "awilix";
import { randomUUID } from "crypto";
import { Temporal } from "@js-temporal/polyfill";
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { env } from "@/env";
import {
  course,
  term,
  user,
  volunteer,
  volunteerToSchedule,
} from "@/server/db/schema";
import {
  notifyScheduleAssignmentJob as job,
  type ScheduleAssignmentChange,
} from "@/server/jobs/definitions/notify-schedule-assignment.job";
import { JobService } from "@/server/services/jobService";
import type { IClassService } from "@/server/services/entity/classService";
import type { ITermService } from "@/server/services/entity/termService";
import type { MockEmailService } from "../mocks/mock-email-service";
import type { MockJobService } from "../mocks/mock-job-service";
import {
  createTestScope,
  type ITestServiceScope,
} from "../helpers/test-service-scope";

describe("schedule assignment notification job", () => {
  let scope: ITestServiceScope;
  let classes: IClassService;
  let terms: ITermService;
  let mail: MockEmailService;
  let jobs: MockJobService;
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
    jobs = scope.resolve("jobService");
    volunteerId = randomUUID();
    await scope.db
      .insert(user)
      .values({
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
    jobs.calls.length = 0;
    jobs.cancellations.length = 0;
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await scope.db.delete(course).where(eq(course.id, classId));
    await scope.db.delete(term).where(eq(term.id, termId));
    await scope.db.delete(user).where(eq(user.id, volunteerId));
    scope.dispose();
  });

  const updateInput = (added: string[], removed: string[]) => ({
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
  const update = (added: string[], removed: string[]) =>
    classes.updateClass(updateInput(added, removed));
  const queued = () =>
    jobs.calls.filter(
      (call) => call.jobName === "jobs.notify-schedule-assignment",
    );
  const latest = () => queued().at(-1)!.data as ScheduleAssignmentChange;
  const execute = (payload = latest(), isCancelled = async () => false) =>
    job.handler(payload, {
      container: scope.container,
      cradle: scope.container.cradle,
      isCancelled,
    });

  it("enqueues with the application transaction and native replacement key", async () => {
    await update([volunteerId], []);
    expect(queued()).toHaveLength(1);
    expect(queued()[0]?.options).toMatchObject({
      transaction: expect.any(Object),
      singletonKey: `${scheduleId}:${volunteerId}`,
      replacePending: true,
    });
    await execute();
    expect(mail.sentEmails).toHaveLength(1);
    expect(mail.sentEmails[0]).toMatchObject({
      to: `${volunteerId}@test.com`,
      subject: "New schedule assignment: Assignment class",
      text: expect.stringContaining("Jul 15"),
      html: expect.stringContaining('href="http://localhost:3000/schedule"'),
    });
    expect(queued()).toHaveLength(1); // No second rendered-email queue.
  });

  it("rolls back the assignment when enqueueing fails", async () => {
    vi.spyOn(jobs, "run").mockRejectedValueOnce(new Error("queue unavailable"));
    await expect(update([volunteerId], [])).rejects.toThrow(
      "queue unavailable",
    );
    expect(
      await scope.db
        .select()
        .from(volunteerToSchedule)
        .where(eq(volunteerToSchedule.scheduleId, scheduleId)),
    ).toHaveLength(0);
  });

  it("ignores cancelled additions after add/remove/add and sends the latest addition", async () => {
    await update([volunteerId], []);
    const old = latest();
    await update([], [volunteerId]);
    await update([volunteerId], []);
    expect(queued()).toHaveLength(3);
    expect(
      queued().every(
        (call) =>
          call.options?.singletonKey === `${scheduleId}:${volunteerId}` &&
          call.options.replacePending,
      ),
    ).toBe(true);
    await execute(old, async () => true);
    expect(mail.sentEmails).toHaveLength(0);
    await execute();
    expect(mail.sentEmails).toHaveLength(1);
  });

  it("does not enqueue unchanged assignments", async () => {
    await update([volunteerId], []);
    await update([volunteerId], []);
    expect(queued()).toHaveLength(1);
  });

  it("does not notify net-zero insert/remove changes", async () => {
    await update([volunteerId], [volunteerId]);
    expect(queued()).toHaveLength(0);
  });

  it("describes the removed schedule clearly", async () => {
    await update([volunteerId], []);
    await update([], [volunteerId]);
    await execute();
    expect(mail.sentEmails).toHaveLength(1);
    expect(mail.sentEmails[0]).toMatchObject({
      subject: "Schedule assignment removed: Assignment class",
      text: expect.stringContaining("Removed schedule"),
    });
  });

  it.each(["added", "removed"] as const)(
    "rechecks current membership for stale %s jobs",
    async (change) => {
      await update([volunteerId], []);
      let old = latest();
      await update([], [volunteerId]);
      if (change === "removed") {
        old = latest();
        await update([volunteerId], []);
      }
      await execute(old);
      expect(mail.sentEmails).toHaveLength(0);
    },
  );

  it.each(["inactive", "unpublished term", "unpublished class"])(
    "revalidates %s at delivery",
    async (state) => {
      await update([volunteerId], []);
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
      await execute();
      expect(mail.sentEmails).toHaveLength(0);
    },
  );

  it("throws SMTP failures for pg-boss to retry and rechecks state on the next attempt", async () => {
    await update([volunteerId], []);
    const old = latest();
    vi.spyOn(mail, "send").mockRejectedValueOnce(new Error("SMTP unavailable"));
    await expect(execute(old)).rejects.toThrow("SMTP unavailable");
    await update([], [volunteerId]);
    await execute(old, async () => true);
    expect(mail.sentEmails).toHaveLength(0);
    await execute();
    expect(mail.sentEmails).toHaveLength(1);
    expect(mail.sentEmails[0]?.subject).toContain("removed");
  });

  it("does not retrospectively enqueue draft class assignments", async () => {
    await scope.db
      .update(course)
      .set({ published: false })
      .where(eq(course.id, classId));
    await update([volunteerId], []);
    await scope.db
      .update(course)
      .set({ published: true })
      .where(eq(course.id, classId));
    expect(queued()).toHaveLength(0);
  });

  it("does not retrospectively enqueue unpublished term assignments", async () => {
    await terms.unpublishTerm(termId);
    await update([volunteerId], []);
    await terms.publishTerm(termId);
    expect(queued()).toHaveLength(0);
  });

  it("requests native cancellation of an older job when hidden assignments change", async () => {
    await update([volunteerId], []);
    const old = latest();
    await terms.unpublishTerm(termId);
    await update([], [volunteerId]);
    await update([volunteerId], []);
    await terms.publishTerm(termId);
    expect(queued()).toHaveLength(1);
    expect(jobs.cancellations).toHaveLength(2);
    expect(
      jobs.cancellations.every(
        (call) => call.singletonKey === `${scheduleId}:${volunteerId}`,
      ),
    ).toBe(true);
    await execute(old, async () => true);
    expect(mail.sentEmails).toHaveLength(0);
  });

  it("delivers additions and removals through the real pg-boss worker", async () => {
    const container = scope.container.createScope();
    const realJobs = new JobService({ container, env });
    container.register({ jobService: asValue(realJobs) });
    const realClasses = container.resolve<IClassService>("classService");
    try {
      await realJobs.start();
      await realClasses.updateClass(updateInput([volunteerId], []));
      await vi.waitFor(() => expect(mail.sentEmails).toHaveLength(1), {
        timeout: 10_000,
      });
      expect(mail.sentEmails[0]?.subject).toContain("New schedule assignment");
      await realClasses.updateClass(updateInput([], [volunteerId]));
      await vi.waitFor(() => expect(mail.sentEmails).toHaveLength(2), {
        timeout: 10_000,
      });
      expect(mail.sentEmails[1]?.subject).toContain("removed");
    } finally {
      await realJobs.stop();
      await container.dispose();
    }
  });
});
