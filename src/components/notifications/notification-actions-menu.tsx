"use client";

import { Archive, Check, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/primitives/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { clientApi } from "@/trpc/client";

interface NotificationActionsMenuProps {
  isArchivedView: boolean;
  hasUnread: boolean;
  hasItems: boolean;
}

export function NotificationActionsMenu({
  isArchivedView,
  hasUnread,
  hasItems,
}: NotificationActionsMenuProps) {
  const utils = clientApi.useUtils();

  const invalidate = () => {
    void utils.notification.unreadCount.invalidate();
    void utils.notification.list.invalidate();
  };

  const markAllAsRead = clientApi.notification.markAllAsRead.useMutation({
    onSuccess: invalidate,
  });

  const archiveAll = clientApi.notification.archiveAll.useMutation({
    onSuccess: invalidate,
  });

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          tooltip="More actions"
          startIcon={<MoreHorizontal />}
        ></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          disabled={markAllAsRead.isPending || isArchivedView || !hasUnread}
          onSelect={() => markAllAsRead.mutate()}
        >
          <Check className="mr-2 size-4" />
          Mark all as read
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={archiveAll.isPending || isArchivedView || !hasItems}
          onSelect={() => archiveAll.mutate()}
        >
          <Archive className="mr-2 size-4" />
          Archive all
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
