"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { Archive, ArchiveRestore, Expand, MailOpen, Mail } from "lucide-react";
import type { ListNotification } from "@/models/notification";
import { Button as UIButton } from "@/components/ui/button";
import { Button } from "@/components/primitives/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { clientApi } from "@/trpc/client";
import { NotificationDetailDialog } from "./notification-detail-dialog";
import { timeAgo } from "./utils";
import { cn } from "@/lib/utils";

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
  const [detailOpen, setDetailOpen] = useState(false);
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

  const handleView = () => {
    if (!notification.read) {
      markAsRead.mutate({ notificationId: notification.id });
    }
    setDetailOpen(true);
  };

  const handleDialogNavigate = (url: string) => {
    setDetailOpen(false);
    router.push(url as Route);
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
      className={`group/item relative flex w-full gap-10 pr-4 pl-3 py-2 text-left has-[button[data-overlay]:hover]:bg-accent ${
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
        <p
          className={`text-sm truncate ${
            !isArchivedView && isUnread
              ? "font-semibold text-foreground"
              : "text-foreground"
          }`}
        >
          {notification.title}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-3">
          {notification.body}
        </p>
      </div>

      {/* Date / actions — swap on hover */}
      <div className="relative z-10 shrink-0 flex items-start">
        {/* Date — hidden on hover */}
        <span className="flex items-center gap-1 text-xs text-muted-foreground group-hover/item:invisible">
          {timeAgo(new Date(notification.createdAt))}
          <span
            className={cn(
              "size-2 rounded-full bg-blue-500",
              (isArchivedView || !isUnread) && "invisible",
            )}
          />
        </span>

        {/* Actions — shown on hover, positioned over the date */}
        <div className="absolute -right-1 invisible group-hover/item:visible">
          <ButtonGroup>
            <Button
              variant="outline"
              size="icon-sm"
              tooltip="View"
              onClick={handleView}
              startIcon={<Expand />}
            ></Button>
            {isArchivedView ? (
              <Button
                variant="outline"
                size="icon-sm"
                tooltip="Unarchive"
                onClick={() =>
                  unarchive.mutate({ notificationId: notification.id })
                }
                startIcon={<ArchiveRestore />}
              ></Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="icon-sm"
                  tooltip={isUnread ? "Mark as read" : "Mark as unread"}
                  onClick={handleToggleRead}
                  startIcon={isUnread ? <MailOpen /> : <Mail />}
                ></Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  tooltip="Archive"
                  onClick={() =>
                    archive.mutate({ notificationId: notification.id })
                  }
                  startIcon={<Archive />}
                ></Button>
              </>
            )}
          </ButtonGroup>
        </div>
      </div>

      <NotificationDetailDialog
        notification={notification}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onNavigate={handleDialogNavigate}
      />
    </div>
  );
}
