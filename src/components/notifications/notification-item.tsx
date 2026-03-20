"use client";

import type { NotificationDB } from "@/server/db/schema/notification";

function timeAgo(date: Date): string {
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

interface NotificationItemProps {
  notification: NotificationDB;
  onClick: () => void;
}

export function NotificationItem({
  notification,
  onClick,
}: NotificationItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-accent ${
        !notification.read ? "bg-accent/40" : ""
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={`text-sm truncate ${
              !notification.read
                ? "font-semibold text-foreground"
                : "text-foreground"
            }`}
          >
            {notification.title}
          </p>
          {!notification.read && (
            <span className="mt-1.5 size-2 shrink-0 rounded-full bg-blue-500" />
          )}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
          {notification.body}
        </p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          {timeAgo(new Date(notification.createdAt))}
        </p>
      </div>
    </button>
  );
}
