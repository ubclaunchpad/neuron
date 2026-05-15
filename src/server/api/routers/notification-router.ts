import {
  ArchiveNotificationInput,
  ClearNotificationPreferenceInput,
  ListNotificationsInput,
  MarkAsReadInput,
  SetNotificationPreferenceInput,
} from "@/models/api/notification";
import type { Role } from "@/models/interfaces";
import { getListNotification } from "@/models/notification";
import { authorizedProcedure } from "@/server/api/procedures";
import { createTRPCRouter } from "@/server/api/trpc";

export const notificationRouter = createTRPCRouter({
  list: authorizedProcedure()
    .input(ListNotificationsInput)
    .query(async ({ input, ctx }) => {
      // ===== MOCK DATA FOR TESTING - REMOVE WHEN DONE =====
      const ENABLE_MOCK_NOTIFICATIONS = true;

      if (ENABLE_MOCK_NOTIFICATIONS) {
        const now = new Date();
        const mockNotifications = [
          // Today (3 items)
          {
            id: "mock-1",
            type: "shift.cancelled",
            title: "Shift Cancelled: Intro to Python",
            body: "The shift on May 12, 2026 for Intro to Python has been cancelled. Reason: Instructor unavailable",
            linkUrl: "/classes/intro-python",
            read: false,
            archived: false,
            createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
          },
          {
            id: "mock-2",
            type: "coverage.requested",
            title: "Coverage Needed: Data Science 101",
            body: "Alex Rivera is requesting coverage for Data Science 101 on May 10, 2026.",
            linkUrl: "/coverage-requests",
            read: false,
            archived: false,
            createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
          },
          {
            id: "mock-3",
            type: "shift.reminder",
            title: "Shift Reminder: Web Development",
            body: "Your shift for Web Development starts at 2:00 PM today.",
            linkUrl: "/my-shifts",
            read: true,
            archived: false,
            createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
          },
          // This Week (3 items)
          {
            id: "mock-4",
            type: "shift.no-checkin",
            title: "Missed Check-in: Machine Learning",
            body: "2 volunteer(s) did not check in for Machine Learning on May 8, 2026: Jordan Smith, Taylor Chen",
            linkUrl: "/admin/attendance",
            read: false,
            archived: false,
            createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
          },
          {
            id: "mock-5",
            type: "coverage.filled",
            title: "Coverage Filled: JavaScript Basics",
            body: "Sam Wilson has picked up the shift for JavaScript Basics on May 7, 2026 (originally requested by Chris Lee).",
            linkUrl: "/coverage-requests",
            read: true,
            archived: false,
            createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
          },
          {
            id: "mock-6",
            type: "shift.reminder",
            title: "Shift Reminder: Database Design",
            body: "Your shift for Database Design starts at 10:00 AM on May 6, 2026.",
            linkUrl: "/my-shifts",
            read: true,
            archived: false,
            createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
          },
          // This Month (3 items)
          {
            id: "mock-7",
            type: "coverage.filled-personal",
            title: "Coverage Picked Up: React Fundamentals",
            body: "Good news! Morgan Taylor has picked up your shift for React Fundamentals on April 28, 2026. You no longer need to attend this shift.",
            linkUrl: "/my-shifts",
            read: true,
            archived: false,
            createdAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
          },
          {
            id: "mock-8",
            type: "shift.cancelled",
            title: "Shift Cancelled: Cloud Computing",
            body: "The shift on April 25, 2026 for Cloud Computing has been cancelled. Reason: Holiday",
            linkUrl: "/classes/cloud-computing",
            read: true,
            archived: false,
            createdAt: new Date(now.getTime() - 17 * 24 * 60 * 60 * 1000),
          },
          {
            id: "mock-9",
            type: "coverage.requested",
            title: "Coverage Needed: TypeScript Workshop",
            body: "Jamie Park is requesting coverage for TypeScript Workshop on April 20, 2026.",
            linkUrl: "/coverage-requests",
            read: true,
            archived: false,
            createdAt: new Date(now.getTime() - 22 * 24 * 60 * 60 * 1000),
          },
          // Older (3 items)
          {
            id: "mock-10",
            type: "coverage.available",
            title: "Coverage Opportunity: API Design",
            body: "A shift for API Design on March 20, 2026 needs coverage.",
            linkUrl: "/coverage-requests",
            read: true,
            archived: false,
            createdAt: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
          },
          {
            id: "mock-11",
            type: "shift.no-checkin",
            title: "Missed Check-in: Python Advanced",
            body: "1 volunteer(s) did not check in for Python Advanced on March 15, 2026: Casey Brown",
            linkUrl: "/admin/attendance",
            read: true,
            archived: false,
            createdAt: new Date(now.getTime() - 58 * 24 * 60 * 60 * 1000),
          },
          {
            id: "mock-12",
            type: "shift.reminder",
            title: "Shift Reminder: Git Fundamentals",
            body: "Your shift for Git Fundamentals starts at 9:00 AM on March 1, 2026.",
            linkUrl: "/my-shifts",
            read: true,
            archived: false,
            createdAt: new Date(now.getTime() - 72 * 24 * 60 * 60 * 1000),
          },
        ];

        let filtered = mockNotifications;
        if (input.read !== undefined) {
          filtered = filtered.filter((n) => n.read === input.read);
        }
        if (input.archived !== undefined) {
          filtered = filtered.filter((n) => n.archived === input.archived);
        }

        return {
          items: filtered.slice(0, input.limit ?? 20),
          nextCursor: null,
        };
      }
      // ===== END MOCK DATA =====

      const userId = ctx.currentSessionService.requireUser().id;
      const result = await ctx.notificationService.getNotifications({
        userId,
        type: input.type,
        read: input.read,
        archived: input.archived,
        limit: input.limit,
        cursor: input.cursor,
      });
      return {
        items: result.items.map(getListNotification),
        nextCursor: result.nextCursor,
      };
    }),

  unreadCount: authorizedProcedure().query(async ({ ctx }) => {
    const userId = ctx.currentSessionService.requireUser().id;
    return ctx.notificationService.getUnreadCount(userId);
  }),

  markAsRead: authorizedProcedure()
    .input(MarkAsReadInput)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.currentSessionService.requireUser().id;
      await ctx.notificationService.markAsRead(input.notificationId, userId);
    }),

  markAsUnread: authorizedProcedure()
    .input(MarkAsReadInput)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.currentSessionService.requireUser().id;
      await ctx.notificationService.markAsUnread(input.notificationId, userId);
    }),

  markAllAsRead: authorizedProcedure().mutation(async ({ ctx }) => {
    const userId = ctx.currentSessionService.requireUser().id;
    await ctx.notificationService.markAllAsRead(userId);
  }),

  archive: authorizedProcedure()
    .input(ArchiveNotificationInput)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.currentSessionService.requireUser().id;
      await ctx.notificationService.archive(input.notificationId, userId);
    }),

  unarchive: authorizedProcedure()
    .input(ArchiveNotificationInput)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.currentSessionService.requireUser().id;
      await ctx.notificationService.unarchive(input.notificationId, userId);
    }),

  archiveAll: authorizedProcedure().mutation(async ({ ctx }) => {
    const userId = ctx.currentSessionService.requireUser().id;
    await ctx.notificationService.archiveAll(userId);
  }),

  preferences: authorizedProcedure().query(async ({ ctx }) => {
    const user = ctx.currentSessionService.requireUser();
    return ctx.preferenceService.getEffectivePreferences(
      user.id,
      user.role as Role,
    );
  }),

  setPreference: authorizedProcedure()
    .input(SetNotificationPreferenceInput)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.currentSessionService.requireUser().id;
      await ctx.preferenceService.setPreference({
        userId,
        type: input.type,
        channel: input.channel,
        enabled: input.enabled,
      });
    }),

  clearPreference: authorizedProcedure()
    .input(ClearNotificationPreferenceInput)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.currentSessionService.requireUser().id;
      await ctx.preferenceService.clearPreference({
        userId,
        type: input.type,
        channel: input.channel,
      });
    }),
});
