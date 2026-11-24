import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { randomUUID } from "crypto";
import { asClass } from "awilix";
import { TRPCError } from "@trpc/server";
import { eq, inArray, sql } from "drizzle-orm";
import { notification, notificationPreference, user } from "@/server/db/schema";
import { createCallerFactory } from "@/server/api/trpc";
import { notificationRouter } from "@/server/api/routers/notification-router";
import {
  NotificationService,
  type INotificationService,
} from "@/server/services/notificationService";
import {
  PreferenceService,
  type IPreferenceService,
} from "@/server/services/preferenceService";
import type { User } from "@/lib/auth";
import {
  createTestScope,
  type ITestServiceScope,
} from "../helpers/test-service-scope";

const createNotificationCaller = createCallerFactory(notificationRouter);
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe("notificationRouter", () => {
  let scope: ITestServiceScope;
  let notificationService: INotificationService;
  let userA: User;
  let userB: User;
  const createdUserIds: string[] = [];

  async function createTestUser(overrides?: Partial<User>): Promise<User> {
    const id = randomUUID();
    const now = new Date();
    const testUser: User = {
      id,
      name: "Test",
      lastName: "User",
      email: `notif-router-${Date.now()}-${randomUUID()}@test.com`,
      role: "volunteer",
      status: "active",
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
      image: null,
      ...overrides,
    };

    await scope.db.insert(user).values({
      id: testUser.id,
      name: testUser.name,
      lastName: testUser.lastName,
      email: testUser.email,
      role: testUser.role,
      status: testUser.status,
      emailVerified: testUser.emailVerified,
      createdAt: testUser.createdAt,
      updatedAt: testUser.updatedAt,
      image: testUser.image,
    });
    createdUserIds.push(id);
    return testUser;
  }

  function callerFor(targetUser: User) {
    scope.mockSession.setUser(targetUser);
    return createNotificationCaller(scope.container.cradle);
  }

  beforeEach(async () => {
    scope = createTestScope();
    scope.container.register({
      preferenceService:
        asClass<IPreferenceService>(PreferenceService).scoped(),
      notificationService:
        asClass<INotificationService>(NotificationService).scoped(),
    });
    notificationService = scope.resolve<INotificationService>(
      "notificationService",
    );

    userA = await createTestUser({ name: "Alice", lastName: "Volunteer" });
    userB = await createTestUser({ name: "Bob", lastName: "Volunteer" });
  });

  afterEach(async () => {
    if (createdUserIds.length > 0) {
      await scope.db
        .delete(notification)
        .where(inArray(notification.userId, createdUserIds));
      await scope.db
        .delete(notificationPreference)
        .where(inArray(notificationPreference.userId, createdUserIds));
      await scope.db.delete(user).where(inArray(user.id, createdUserIds));
      createdUserIds.length = 0;
    }
    scope.dispose();
  });

  describe("authentication and user scoping", () => {
    it("returns an empty list and zero unread count when user has no stored notifications", async () => {
      const caller = callerFor(userA);

      const [listResult, unreadCount] = await Promise.all([
        caller.list({}),
        caller.unreadCount(),
      ]);

      expect(listResult).toEqual({ items: [], nextCursor: null });
      expect(unreadCount).toBe(0);
    });

    it("rejects unauthenticated requests", async () => {
      scope.mockSession.setUnauthenticated();
      const caller = createNotificationCaller(scope.container.cradle);

      await expect(caller.list({})).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      });
      await expect(caller.unreadCount()).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      });
    });

    it("rejects non-active users", async () => {
      const unverifiedUser = await createTestUser({ status: "unverified" });
      const caller = callerFor(unverifiedUser);

      await expect(caller.list({})).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      });
    });

    it("creates persisted notifications via NotificationService and scopes retrieval to the current user", async () => {
      const shiftIdA = randomUUID();
      const shiftIdB = randomUUID();

      await notificationService.processNotification({
        type: "shift.cancelled",
        audience: { kind: "user", userId: userA.id },
        context: {
          shiftId: shiftIdA,
          className: "Intro to Python",
          shiftDate: "May 12, 2026",
          cancelReason: "Instructor unavailable",
          cancelledByName: "Admin User",
        },
        idempotencyKey: `test-shift-cancelled-${shiftIdA}`,
      });

      await notificationService.processNotification({
        type: "shift.reminder",
        audience: { kind: "user", userId: userB.id },
        context: {
          shiftId: shiftIdB,
          className: "Web Development",
          shiftDate: "May 13, 2026",
          shiftTime: "2:00 PM",
        },
        idempotencyKey: `test-shift-reminder-${shiftIdB}`,
      });

      const listA = await callerFor(userA).list({});
      const unreadA = await callerFor(userA).unreadCount();

      expect(listA.items).toHaveLength(1);
      expect(listA.nextCursor).toBeNull();
      expect(unreadA).toBe(1);
      expect(listA.items[0]).toMatchObject({
        type: "shift.cancelled",
        title: "Shift Cancelled: Intro to Python",
        body: "The shift on May 12, 2026 for Intro to Python has been cancelled. Reason: Instructor unavailable.",
        linkUrl: `/schedule?shiftId=${shiftIdA}`,
        read: false,
        archived: false,
      });
      expect(listA.items[0]!.id).toMatch(UUID_REGEX);

      const listB = await callerFor(userB).list({});
      const unreadB = await callerFor(userB).unreadCount();

      expect(listB.items).toHaveLength(1);
      expect(unreadB).toBe(1);
      expect(listB.items[0]!.title).toBe("Shift Reminder: Web Development");
      expect(listB.items[0]!.id).not.toBe(listA.items[0]!.id);
    });
  });

  describe("filtering and pagination", () => {
    it("filters by type, read, and archived flags on the stored dataset", async () => {
      const baseTime = new Date("2026-05-10T12:00:00.000Z");

      const [unreadCancel, readReminder, archivedCancel] = await scope.db
        .insert(notification)
        .values([
          {
            userId: userA.id,
            type: "shift.cancelled",
            title: "Cancelled 1",
            body: "Body 1",
            read: false,
            archived: false,
            createdAt: new Date(baseTime.getTime() + 3_000),
          },
          {
            userId: userA.id,
            type: "shift.reminder",
            title: "Reminder 1",
            body: "Body 2",
            read: true,
            readAt: new Date(baseTime.getTime() + 2_500),
            archived: false,
            createdAt: new Date(baseTime.getTime() + 2_000),
          },
          {
            userId: userA.id,
            type: "shift.cancelled",
            title: "Archived Cancelled",
            body: "Body 3",
            read: true,
            readAt: new Date(baseTime.getTime() + 1_500),
            archived: true,
            archivedAt: new Date(baseTime.getTime() + 1_500),
            createdAt: new Date(baseTime.getTime() + 1_000),
          },
        ])
        .returning();

      const caller = callerFor(userA);

      // Default list excludes archived items
      const defaultList = await caller.list({});
      expect(defaultList.items.map((n) => n.id)).toEqual([
        unreadCancel!.id,
        readReminder!.id,
      ]);

      // Unread filter matches unreadCount
      const unreadList = await caller.list({ read: false, archived: false });
      const unreadCount = await caller.unreadCount();
      expect(unreadList.items.map((n) => n.id)).toEqual([unreadCancel!.id]);
      expect(unreadCount).toBe(unreadList.items.length);

      // Read filter
      const readList = await caller.list({ read: true, archived: false });
      expect(readList.items.map((n) => n.id)).toEqual([readReminder!.id]);

      // Type filter
      const cancelList = await caller.list({ type: "shift.cancelled" });
      expect(cancelList.items.map((n) => n.id)).toEqual([unreadCancel!.id]);

      // Archived filter
      const archivedList = await caller.list({ archived: true });
      expect(archivedList.items.map((n) => n.id)).toEqual([archivedCancel!.id]);
    });

    it("paginates deterministically with nextCursor including sub-millisecond timestamps", async () => {
      // Distinct and tied microsecond timestamps within the same millisecond
      // deterministically exercise precision preservation and UUID tie-breaking.
      const timestamps = [
        "2026-05-10T12:00:00.123456Z",
        "2026-05-10T12:00:00.123456Z",
        "2026-05-10T12:00:00.123456Z",
        "2026-05-10T12:00:00.123455Z",
        "2026-05-10T12:00:00.123000Z",
      ];

      const inserted = await scope.db
        .insert(notification)
        .values(
          timestamps.map((ts, index) => ({
            userId: userA.id,
            type: "shift.reminder",
            title: `Batch Notification ${index + 1}`,
            body: `Batch body ${index + 1}`,
            createdAt: sql`${ts}::timestamptz`,
          })),
        )
        .returning();

      const expectedIds = inserted
        .map((row, index) => ({ id: row.id, ts: timestamps[index]! }))
        .sort((a, b) =>
          a.ts !== b.ts
            ? a.ts < b.ts
              ? 1
              : -1
            : a.id < b.id
              ? 1
              : a.id > b.id
                ? -1
                : 0,
        )
        .map((n) => n.id);

      const caller = callerFor(userA);
      const collectedIds: string[] = [];
      let cursor: string | undefined;
      let pages = 0;

      do {
        const page = await caller.list({ limit: 2, cursor });
        collectedIds.push(...page.items.map((item) => item.id));
        cursor = page.nextCursor ?? undefined;
        pages += 1;
      } while (cursor && pages < 10);

      expect(pages).toBe(3);
      expect(collectedIds).toEqual(expectedIds);
    });

    it("rejects malformed pagination cursors with BAD_REQUEST", async () => {
      const caller = callerFor(userA);

      for (const badCursor of [
        "",
        "2026-05-10T12:00:00.000Z",
        "2026-05-10T12:00:00+16:00|00000000-0000-0000-0000-000000000000",
        "0000-01-01T00:00:00.000000Z|00000000-0000-0000-0000-000000000000",
        `2026-05-10T12:00:00.${"1".repeat(200)}Z|00000000-0000-0000-0000-000000000000`,
        "not-a-date|00000000-0000-0000-0000-000000000000",
        "2026-05-10T12:00:00.000Z|mock-1",
        "2026-05-10T12:00:00.000Z|00000000-0000-0000-0000-000000000000|extra",
      ]) {
        await expect(caller.list({ cursor: badCursor })).rejects.toMatchObject({
          code: "BAD_REQUEST",
        });
      }
    });
  });

  describe("state updates and unread count consistency", () => {
    it("updates read/unread and archive/unarchive state using real IDs from list", async () => {
      const shiftId = randomUUID();
      await notificationService.processNotification({
        type: "shift.cancelled",
        audience: { kind: "user", userId: userA.id },
        context: {
          shiftId,
          className: "Data Science 101",
          shiftDate: "May 14, 2026",
          cancelReason: "Room unavailable",
          cancelledByName: "Admin User",
        },
        idempotencyKey: `state-test-${shiftId}`,
      });

      const caller = callerFor(userA);
      const initialList = await caller.list({});
      expect(initialList.items).toHaveLength(1);
      const notificationId = initialList.items[0]!.id;
      expect(await caller.unreadCount()).toBe(1);

      // Mark as read
      await caller.markAsRead({ notificationId });
      expect(await caller.unreadCount()).toBe(0);
      expect((await caller.list({ read: false })).items).toHaveLength(0);
      expect((await caller.list({ read: true })).items[0]!.id).toBe(
        notificationId,
      );

      // Mark as unread
      await caller.markAsUnread({ notificationId });
      expect(await caller.unreadCount()).toBe(1);
      expect((await caller.list({ read: false })).items[0]!.id).toBe(
        notificationId,
      );

      // Archive (marks read and moves to archived view)
      await caller.archive({ notificationId });
      expect(await caller.unreadCount()).toBe(0);
      expect((await caller.list({ archived: false })).items).toHaveLength(0);
      const archivedItems = (await caller.list({ archived: true })).items;
      expect(archivedItems).toHaveLength(1);
      expect(archivedItems[0]).toMatchObject({
        id: notificationId,
        archived: true,
        read: true,
      });

      // Unarchive (returns to active list)
      await caller.unarchive({ notificationId });
      expect((await caller.list({ archived: true })).items).toHaveLength(0);
      const restoredItems = (await caller.list({ archived: false })).items;
      expect(restoredItems).toHaveLength(1);
      expect(restoredItems[0]).toMatchObject({
        id: notificationId,
        archived: false,
      });
    });

    it("supports markAllAsRead and archiveAll scoped strictly to the current user", async () => {
      await scope.db.insert(notification).values([
        {
          userId: userA.id,
          type: "shift.reminder",
          title: "A1",
          body: "Body A1",
        },
        {
          userId: userA.id,
          type: "shift.reminder",
          title: "A2",
          body: "Body A2",
        },
        {
          userId: userB.id,
          type: "shift.reminder",
          title: "B1",
          body: "Body B1",
        },
      ]);

      expect(await callerFor(userA).unreadCount()).toBe(2);
      expect(await callerFor(userB).unreadCount()).toBe(1);

      await callerFor(userA).markAllAsRead();
      expect(await callerFor(userA).unreadCount()).toBe(0);
      expect((await callerFor(userA).list({ read: true })).items).toHaveLength(
        2,
      );
      expect(await callerFor(userB).unreadCount()).toBe(1);

      await callerFor(userA).archiveAll();
      expect((await callerFor(userA).list({})).items).toHaveLength(0);
      expect(
        (await callerFor(userA).list({ archived: true })).items,
      ).toHaveLength(2);
      expect((await callerFor(userB).list({})).items).toHaveLength(1);
      expect(await callerFor(userB).unreadCount()).toBe(1);
    });

    it("rejects non-UUID notification IDs and prevents cross-user mutations", async () => {
      const [userBNotification] = await scope.db
        .insert(notification)
        .values({
          userId: userB.id,
          type: "shift.reminder",
          title: "Private to B",
          body: "Only B should mutate this",
        })
        .returning();

      const callerA = callerFor(userA);

      // Non-UUID IDs (like legacy mock IDs) fail input validation
      for (const action of [
        () => callerA.markAsRead({ notificationId: "mock-1" }),
        () => callerA.markAsUnread({ notificationId: "mock-1" }),
        () => callerA.archive({ notificationId: "mock-1" }),
        () => callerA.unarchive({ notificationId: "mock-1" }),
      ]) {
        await expect(action()).rejects.toMatchObject({ code: "BAD_REQUEST" });
      }

      // Cross-user access fails with NOT_FOUND
      for (const action of [
        () => callerA.markAsRead({ notificationId: userBNotification!.id }),
        () => callerA.markAsUnread({ notificationId: userBNotification!.id }),
        () => callerA.archive({ notificationId: userBNotification!.id }),
        () => callerA.unarchive({ notificationId: userBNotification!.id }),
      ]) {
        await expect(action()).rejects.toSatisfy(
          (err: unknown) =>
            err instanceof TRPCError && err.code === "NOT_FOUND",
        );
      }

      // Verify user B's notification was untouched
      const [row] = await scope.db
        .select()
        .from(notification)
        .where(eq(notification.id, userBNotification!.id));
      expect(row).toMatchObject({ read: false, archived: false });
    });
  });
});
