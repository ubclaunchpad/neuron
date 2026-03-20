import {
  ClearNotificationPreferenceInput,
  ListNotificationsInput,
  MarkAsReadInput,
  SetNotificationPreferenceInput,
} from "@/models/api/notification";
import { authorizedProcedure } from "@/server/api/procedures";
import { createTRPCRouter } from "@/server/api/trpc";

export const notificationRouter = createTRPCRouter({
  list: authorizedProcedure()
    .input(ListNotificationsInput)
    .query(async ({ input, ctx }) => {
      const userId = ctx.currentSessionService.requireUser().id;
      return ctx.notificationService.getNotifications({
        userId,
        type: input.type,
        read: input.read,
        limit: input.limit,
        cursor: input.cursor,
      });
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

  markAllAsRead: authorizedProcedure().mutation(async ({ ctx }) => {
    const userId = ctx.currentSessionService.requireUser().id;
    await ctx.notificationService.markAllAsRead(userId);
  }),

  preferences: authorizedProcedure().query(async ({ ctx }) => {
    const userId = ctx.currentSessionService.requireUser().id;
    return ctx.preferenceService.getEffectivePreferences(userId);
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
