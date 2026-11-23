import { NotificationService } from "@/server/services/notificationService";
import type { MockPreferenceService } from "../mocks/mock-notification-services";
import type { MockJobService } from "../mocks/mock-job-service";
import { JobService, type IJobService } from "@/server/services/jobService";
import type { IUserService } from "@/server/services/entity/userService";
import { randomUUID } from "crypto";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as schema from "@/server/db/schema";
import { deliveryOutbox, user, notification } from "@/server/db/schema";
import { env } from "@/env";
import {
  recordDelivery,
  drainDeliveries,
  MAX_DELIVERY_ATTEMPTS,
} from "@/server/delivery/outbox";
import { deliveryHandlers } from "@/server/delivery/handlers";
import type { MockEmailService } from "../mocks/mock-email-service";
import {
  createTestScope,
  type ITestServiceScope,
} from "../helpers/test-service-scope";

const email = {
  to: "outbox@test.com",
  subject: "Test",
  text: "Hello",
  html: '<a href="https://example.com/SECRET_TOKEN">Test</a>',
};

describe("transactional delivery outbox", () => {
  let scope: ITestServiceScope;
  let mail: MockEmailService;
  let jobs: JobService;
  beforeEach(async () => {
    scope = createTestScope();
    mail = scope.resolve("emailService");
    jobs = new JobService({ container: scope.container, env });
    await scope.db.delete(deliveryOutbox);
  });
  afterEach(async () => {
    vi.restoreAllMocks();
    await scope.db.delete(deliveryOutbox);
    scope.dispose();
  });
  const rows = () => scope.db.select().from(deliveryOutbox);
  const drain = () => drainDeliveries(scope.container.cradle, deliveryHandlers);
  const queueEmail = (key?: string) =>
    scope.db.transaction((tx) =>
      jobs.deliver("email", email, { transaction: tx, idempotencyKey: key }),
    );

  it("persists through the real JobService API without bootstrapping the queue", async () => {
    const start = vi
      .spyOn(jobs, "start")
      .mockRejectedValue(new Error("queue unavailable"));
    await scope.db.transaction(async (tx) => {
      await jobs.deliver("email", email, {
        transaction: tx,
        idempotencyKey: "api-event",
      });
      await jobs.deliver("email", email, {
        transaction: tx,
        idempotencyKey: "api-event",
      });
    });
    expect(start).not.toHaveBeenCalled();
    expect(await rows()).toHaveLength(1);
    await drain();
    expect(mail.sentEmails).toHaveLength(1);
  });

  it("rolls back domain state and mail intent together", async () => {
    const id = randomUUID();
    await expect(
      scope.db.transaction(async (tx) => {
        await tx.insert(user).values({
          id,
          name: "Test",
          lastName: "Outbox",
          email: `${id}@test.com`,
          role: "volunteer",
          status: "active",
        });
        await jobs.deliver("email", email, { transaction: tx });
        throw new Error("rollback");
      }),
    ).rejects.toThrow("rollback");
    expect(
      await scope.db.select().from(user).where(eq(user.id, id)),
    ).toHaveLength(0);
    expect(await rows()).toHaveLength(0);
  });

  it("keeps account status unchanged if its email intent cannot be saved", async () => {
    const id = randomUUID();
    await scope.db.insert(user).values({
      id,
      name: "Test",
      lastName: "Volunteer",
      email: `${id}@test.com`,
      role: "volunteer",
      status: "unverified",
    });
    try {
      vi.spyOn(
        scope.resolve<IJobService>("jobService"),
        "deliver",
      ).mockRejectedValueOnce(new Error("outbox unavailable"));
      await expect(
        scope.resolve<IUserService>("userService").verifyVolunteer(id),
      ).rejects.toThrow("outbox unavailable");
      expect(
        (await scope.db.select().from(user).where(eq(user.id, id)))[0]?.status,
      ).toBe("unverified");
    } finally {
      await scope.db.delete(user).where(eq(user.id, id));
    }
  });

  it("commits without the queue, deduplicates retries, and erases delivered content", async () => {
    await queueEmail("event:recipient");
    await queueEmail("event:recipient");
    expect(await rows()).toHaveLength(1);
    await drain();
    await queueEmail("event:recipient");
    await drain();
    expect(mail.sentEmails).toHaveLength(1);
    expect((await rows())[0]).toMatchObject({
      payload: {},
      processedAt: expect.any(Date),
    });
  });

  it("commits in-app and email fan-out together and deduplicates job retries", async () => {
    const id = randomUUID();
    await scope.db.insert(user).values({
      id,
      name: "Test",
      lastName: "Fanout",
      email: `${id}@test.com`,
      role: "volunteer",
      status: "active",
    });
    const preferences =
      scope.resolve<MockPreferenceService>("preferenceService");
    vi.spyOn(preferences, "getPreferencesForRecipients").mockResolvedValue(
      new Map([
        [
          id,
          new Map([
            ["in_app", true],
            ["email", true],
          ]),
        ],
      ]),
    );
    const service = new NotificationService({
      db: scope.db,
      jobService: scope.resolve<MockJobService>("jobService"),
      preferenceService: preferences,
    });
    const params = {
      type: "shift.cancelled",
      audience: { kind: "user" as const, userId: id },
      context: {
        shiftId: randomUUID(),
        className: "Class",
        shiftDate: "Jul 15",
        cancelReason: "Test",
        cancelledByName: "Admin",
      },
      idempotencyKey: `event:${randomUUID()}`,
    };
    try {
      vi.spyOn(
        scope.resolve<IJobService>("jobService"),
        "deliver",
      ).mockRejectedValueOnce(new Error("outbox unavailable"));
      await expect(service.processNotification(params)).rejects.toThrow(
        "outbox unavailable",
      );
      expect(
        await scope.db
          .select()
          .from(notification)
          .where(eq(notification.userId, id)),
      ).toHaveLength(0);
      await service.processNotification(params);
      await service.processNotification(params);
      expect(
        await scope.db
          .select()
          .from(notification)
          .where(eq(notification.userId, id)),
      ).toHaveLength(1);
      expect(await rows()).toHaveLength(1);
      await drain();
      expect(mail.sentEmails).toHaveLength(1);
    } finally {
      await scope.db.delete(user).where(eq(user.id, id));
    }
  });

  it("serializes delivery across independent database connections", async () => {
    await queueEmail();
    const connection = postgres(env.DATABASE_URL, { max: 4 });
    const db = drizzle(connection, { schema });
    const cradle = { ...scope.container.cradle, db };
    try {
      await Promise.all([
        drainDeliveries(cradle, deliveryHandlers),
        drainDeliveries(cradle, deliveryHandlers),
      ]);
    } finally {
      await connection.end();
    }
    expect(mail.sentEmails).toHaveLength(1);
  });

  it("retains failed mail with backoff and does not log content", async () => {
    await queueEmail();
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(mail, "send").mockRejectedValueOnce(
      new Error("SMTP SECRET_TOKEN"),
    );
    await drain();
    expect((await rows())[0]).toMatchObject({ attempts: 1, processedAt: null });
    expect(JSON.stringify(log.mock.calls)).not.toContain("SECRET_TOKEN");
    await drain();
    expect(mail.sentEmails).toHaveLength(0);
    await scope.db.update(deliveryOutbox).set({ nextAttemptAt: new Date(0) });
    await drain();
    expect(mail.sentEmails).toHaveLength(1);
  });

  it("does not bypass failure backoff when workers overlap", async () => {
    await queueEmail();
    const connection = postgres(env.DATABASE_URL, { max: 4 });
    const cradle = {
      ...scope.container.cradle,
      db: drizzle(connection, { schema }),
    };
    let prepared = 0;
    let release!: () => void;
    const bothPrepared = new Promise<void>((resolve) => {
      release = resolve;
    });
    const prepare = deliveryHandlers.email!.prepare;
    vi.spyOn(deliveryHandlers.email!, "prepare").mockImplementation(
      async (...args) => {
        if (++prepared === 2) release();
        return prepare(...args);
      },
    );
    const send = vi.spyOn(mail, "send").mockImplementation(async () => {
      await bothPrepared;
      throw new Error("temporary SMTP failure");
    });
    try {
      await Promise.all([
        drainDeliveries(cradle, deliveryHandlers),
        drainDeliveries(cradle, deliveryHandlers),
      ]);
    } finally {
      await connection.end();
    }
    expect(send).toHaveBeenCalledTimes(1);
    expect((await rows())[0]).toMatchObject({
      attempts: 1,
      processedAt: null,
      failedAt: null,
      lastErrorCode: "DELIVERY_FAILED",
    });
  });

  it("stops permanent SMTP errors and records a safe code", async () => {
    await queueEmail();
    const send = vi
      .spyOn(mail, "send")
      .mockRejectedValue(
        Object.assign(new Error("SECRET_TOKEN"), { responseCode: 550 }),
      );
    await drain();
    expect((await rows())[0]).toMatchObject({
      attempts: 1,
      failedAt: expect.any(Date),
      lastErrorCode: "SMTP_550",
    });
    await scope.db.update(deliveryOutbox).set({ nextAttemptAt: new Date(0) });
    await drain();
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("caps retries for repeated transient failures", async () => {
    await queueEmail();
    const send = vi
      .spyOn(mail, "send")
      .mockRejectedValue(new Error("temporary failure"));
    for (let attempt = 0; attempt < MAX_DELIVERY_ATTEMPTS + 1; attempt++) {
      await scope.db.update(deliveryOutbox).set({ nextAttemptAt: new Date(0) });
      await drain();
    }
    expect(send).toHaveBeenCalledTimes(MAX_DELIVERY_ATTEMPTS);
    expect((await rows())[0]).toMatchObject({
      attempts: MAX_DELIVERY_ATTEMPTS,
      failedAt: expect.any(Date),
      lastErrorCode: "DELIVERY_FAILED",
    });
  });

  it("cancels pending delivery using JobService without a table write by the caller", async () => {
    await queueEmail("cancelled-event");
    await scope.db.transaction((tx) =>
      jobs.cancelDelivery("email", "cancelled-event", { transaction: tx }),
    );
    await drain();
    expect(mail.sentEmails).toHaveLength(0);
    expect((await rows())[0]?.payload).toEqual({});
  });

  it("serializes duplicate account approvals and deactivations", async () => {
    const id = randomUUID();
    await scope.db
      .insert(user)
      .values({
        id,
        name: "Test",
        lastName: "Concurrent",
        email: `${id}@test.com`,
        role: "volunteer",
        status: "unverified",
      });
    const connection = postgres(env.DATABASE_URL, { max: 4 });
    const { UserService } =
      await import("@/server/services/entity/userService");
    const service = new UserService({
      db: drizzle(connection, { schema }),
      jobService: scope.resolve("jobService"),
    });
    try {
      await Promise.all([
        service.verifyVolunteer(id),
        service.verifyVolunteer(id),
      ]);
      expect(await rows()).toHaveLength(1);
      await Promise.allSettled([
        service.deactivateUser(id),
        service.deactivateUser(id),
      ]);
      expect(await rows()).toHaveLength(2);
    } finally {
      await connection.end();
      await scope.db.delete(user).where(eq(user.id, id));
    }
  });

  it("rejects a superseded revision even when a worker already prepared it", async () => {
    await recordDelivery(scope.db, {
      kind: "test",
      payload: { value: "old" },
      key: "assignment",
      replace: true,
    });
    let superseded = false;
    const send = vi.fn(async () => {});
    await drainDeliveries(scope.container.cradle, {
      test: {
        async prepare() {
          if (!superseded) {
            superseded = true;
            // Use another connection: the transaction retains the fixture pool connection.
            const connection = postgres(env.DATABASE_URL);
            try {
              await recordDelivery(drizzle(connection, { schema }), {
                kind: "test",
                payload: { value: "new" },
                key: "assignment",
                replace: true,
              });
            } finally {
              await connection.end();
            }
          }
          return send;
        },
      },
    });
    expect(send).not.toHaveBeenCalled();
    expect((await rows())[0]?.payload).toEqual({ value: "new" });
  });
});
