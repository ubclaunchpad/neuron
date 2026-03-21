import type { NotificationDB } from "@/server/db/schema/notification";

export function getListNotification(n: NotificationDB) {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    linkUrl: n.linkUrl ?? undefined,
    read: n.read,
    archived: n.archived,
    createdAt: n.createdAt,
  } as const;
}

export type ListNotification = ReturnType<typeof getListNotification>;
