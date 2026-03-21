import type { ListNotification } from "@/models/notification";

export function timeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export type Filter = "all" | "unread" | "archived";

export function getQueryParams(filter: Filter) {
  switch (filter) {
    case "all":
      return { archived: false } as const;
    case "unread":
      return { read: false, archived: false } as const;
    case "archived":
      return { archived: true } as const;
  }
}

export const emptyMessages: Record<Filter, string> = {
  all: "You're all caught up",
  unread: "No unread notifications",
  archived: "No archived notifications",
};

export function groupByDate(
  items: ListNotification[],
): { label: string; items: ListNotification[] }[] {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const sevenDaysAgo = new Date(startOfToday);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const groups: { label: string; items: ListNotification[] }[] = [];
  const todayItems = items.filter((n) => new Date(n.createdAt) >= startOfToday);
  const weekItems = items.filter((n) => {
    const d = new Date(n.createdAt);
    return d < startOfToday && d >= sevenDaysAgo;
  });
  const monthItems = items.filter((n) => {
    const d = new Date(n.createdAt);
    return d < sevenDaysAgo && d >= startOfMonth;
  });
  const olderItems = items.filter((n) => new Date(n.createdAt) < startOfMonth);

  if (todayItems.length > 0) groups.push({ label: "Today", items: todayItems });
  if (weekItems.length > 0)
    groups.push({ label: "This Week", items: weekItems });
  if (monthItems.length > 0)
    groups.push({ label: "This Month", items: monthItems });
  if (olderItems.length > 0) groups.push({ label: "Older", items: olderItems });

  return groups;
}
