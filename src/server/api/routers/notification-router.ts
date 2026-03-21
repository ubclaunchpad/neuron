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
