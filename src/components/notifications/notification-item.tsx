"use client";

import { Archive, ArchiveRestore, MailOpen, Mail } from "lucide-react";
import type { NotificationDB } from "@/server/db/schema/notification";
import { Button as UIButton } from "@/components/ui/button";
import { Button } from "@/components/primitives/button";

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

interface NotificationItemProps {
  notification: NotificationDB;
  onClick: () => void;
  onArchive: (notificationId: string) => void;
  onUnarchive: (notificationId: string) => void;
  onToggleRead: (notificationId: string) => void;
  isArchivedView?: boolean;
}

export function NotificationItem({
  notification,
  onClick,
  onArchive,
  onUnarchive,
  onToggleRead,
  isArchivedView = false,
}: NotificationItemProps) {
  const isUnread = !notification.read;

  return (
    <div
      className={`group/item relative flex w-full gap-3 px-4 py-3 text-left has-[button[data-overlay]:hover]:bg-accent ${
        !isArchivedView && isUnread ? "bg-accent/40" : ""
      }`}
    >
      {/* Overlay button for the entire item click area */}
      <UIButton
        data-overlay
        unstyled
        aria-label={notification.title}
        className="absolute z-10 inset-0 cursor-pointer"
        onClick={onClick}
      />

      {/* Content */}
      <div className="relative flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={`text-sm truncate ${
              !isArchivedView && isUnread
                ? "font-semibold text-foreground"
                : "text-foreground"
            }`}
          >
            {notification.title}
          </p>
          <div className="flex shrink-0 items-center gap-1">
            <span className="text-xs text-muted-foreground">
              {timeAgo(new Date(notification.createdAt))}
            </span>
            {!isArchivedView && isUnread && (
              <span className="size-2 rounded-full bg-blue-500" />
            )}
          </div>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-3">
          {notification.body}
        </p>
      </div>

      {/* Hover actions — sit above the overlay */}
      <div className="relative z-10 flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover/item:opacity-100">
        {isArchivedView ? (
          <Button
            variant="ghost"
            size="icon-sm"
            tooltip="Unarchive"
            onClick={() => onUnarchive(notification.id)}
            startIcon={<ArchiveRestore />}
          ></Button>
        ) : (
          <>
            <Button
              variant="ghost"
              size="icon-sm"
              tooltip={isUnread ? "Mark as read" : "Mark as unread"}
              onClick={() => onToggleRead(notification.id)}
              startIcon={isUnread ? <MailOpen /> : <Mail />}
            ></Button>
            <Button
              variant="ghost"
              size="icon-sm"
              tooltip="Archive"
              onClick={() => onArchive(notification.id)}
              startIcon={<Archive />}
            ></Button>
          </>
        )}
      </div>
    </div>
  );
}
