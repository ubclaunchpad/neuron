"use client";

import { useRouter } from "next/navigation";
import type { Route } from "next";
import { Archive, ArchiveRestore, MailOpen, Mail } from "lucide-react";
import type { ListNotification } from "@/models/notification";
import { Button as UIButton } from "@/components/ui/button";
import { Button } from "@/components/primitives/button";
import { clientApi } from "@/trpc/client";
import { timeAgo } from "./utils";

interface NotificationItemProps {
  notification: ListNotification;
  isArchivedView?: boolean;
  onClose: () => void;
}

export function NotificationItem({
  notification,
  isArchivedView = false,
  onClose,
}: NotificationItemProps) {
  const router = useRouter();
  const utils = clientApi.useUtils();

  const invalidate = () => {
    void utils.notification.unreadCount.invalidate();
    void utils.notification.list.invalidate();
  };

  const markAsRead = clientApi.notification.markAsRead.useMutation({
    onSuccess: invalidate,
  });

  const markAsUnread = clientApi.notification.markAsUnread.useMutation({
    onSuccess: invalidate,
  });

  const archive = clientApi.notification.archive.useMutation({
    onSuccess: invalidate,
  });

  const unarchive = clientApi.notification.unarchive.useMutation({
    onSuccess: invalidate,
  });

  const handleClick = () => {
    markAsRead.mutate({ notificationId: notification.id });
    if (notification.linkUrl) {
      router.push(notification.linkUrl as Route);
    }
    onClose();
  };

  const handleToggleRead = () => {
    if (notification.read) {
      markAsUnread.mutate({ notificationId: notification.id });
    } else {
      markAsRead.mutate({ notificationId: notification.id });
    }
  };

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
        onClick={handleClick}
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
            onClick={() => unarchive.mutate({ notificationId: notification.id })}
            startIcon={<ArchiveRestore />}
          ></Button>
        ) : (
          <>
            <Button
              variant="ghost"
              size="icon-sm"
              tooltip={isUnread ? "Mark as read" : "Mark as unread"}
              onClick={handleToggleRead}
              startIcon={isUnread ? <MailOpen /> : <Mail />}
            ></Button>
            <Button
              variant="ghost"
              size="icon-sm"
              tooltip="Archive"
              onClick={() => archive.mutate({ notificationId: notification.id })}
              startIcon={<Archive />}
            ></Button>
          </>
        )}
      </div>
    </div>
  );
}
