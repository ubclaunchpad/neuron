import { z } from "zod";

export const ListNotificationsInput = z.object({
  type: z.string().optional(),
  read: z.boolean().optional(),
  archived: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  cursor: z.string().datetime().optional(),
});
export type ListNotificationsInput = z.infer<typeof ListNotificationsInput>;

export const MarkAsReadInput = z.object({
  notificationId: z.uuid(),
});
export type MarkAsReadInput = z.infer<typeof MarkAsReadInput>;

export const ArchiveNotificationInput = z.object({
  notificationId: z.uuid(),
});
export type ArchiveNotificationInput = z.infer<
  typeof ArchiveNotificationInput
>;

export const SetNotificationPreferenceInput = z.object({
  type: z.string(),
  channel: z.enum(["email", "in_app", "push"]),
  enabled: z.boolean(),
});
export type SetNotificationPreferenceInput = z.infer<
  typeof SetNotificationPreferenceInput
>;

export const ClearNotificationPreferenceInput = z.object({
  type: z.string(),
  channel: z.enum(["email", "in_app", "push"]),
});
export type ClearNotificationPreferenceInput = z.infer<
  typeof ClearNotificationPreferenceInput
>;
