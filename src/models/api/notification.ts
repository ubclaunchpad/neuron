import { z } from "zod";

const NotificationCursorTimestamp = z.iso.datetime({ offset: true });
const NotificationCursorId = z.uuid();

export function parseNotificationCursor(
  cursor: string,
): { createdAt: string; id: string } | null {
  const parts = cursor.split("|");
  if (parts.length !== 2) return null;

  const [createdAt, id] = parts;
  if (
    !createdAt ||
    !id ||
    !NotificationCursorTimestamp.safeParse(createdAt).success ||
    !NotificationCursorId.safeParse(id).success
  ) {
    return null;
  }

  return { createdAt, id };
}

export const NotificationCursor = z
  .string()
  .refine((value) => parseNotificationCursor(value) !== null, {
    message: "Cursor must be in '<ISO datetime>|<uuid>' format",
  });

export const ListNotificationsInput = z.object({
  type: z.string().optional(),
  read: z.boolean().optional(),
  archived: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  cursor: NotificationCursor.optional(),
});
export type ListNotificationsInput = z.infer<typeof ListNotificationsInput>;

export const MarkAsReadInput = z.object({
  notificationId: z.uuid(),
});
export type MarkAsReadInput = z.infer<typeof MarkAsReadInput>;

export const ArchiveNotificationInput = z.object({
  notificationId: z.uuid(),
});
export type ArchiveNotificationInput = z.infer<typeof ArchiveNotificationInput>;

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
