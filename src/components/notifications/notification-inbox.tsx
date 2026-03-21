"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import {
  Archive,
  Check,
  Inbox,
  ListFilter,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/primitives/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { clientApi } from "@/trpc/client";
import { NotificationItem } from "./notification-item";

type Filter = "all" | "unread" | "archived";

function getQueryParams(filter: Filter) {
  switch (filter) {
    case "all":
      return { archived: false } as const;
    case "unread":
      return { read: false, archived: false } as const;
    case "archived":
      return { archived: true } as const;
  }
}

const filterLabels: Record<Filter, string> = {
  all: "Unread & read",
  unread: "Unread",
  archived: "Archived",
};

const emptyMessages: Record<Filter, string> = {
  all: "You're all caught up",
  unread: "No unread notifications",
  archived: "No archived notifications",
};

export function NotificationInbox() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const utils = clientApi.useUtils();

  const { data: unreadCount = 0 } = clientApi.notification.unreadCount.useQuery(
    undefined,
    {
      refetchInterval: 30_000,
    },
  );

  const { data, isLoading } = clientApi.notification.list.useQuery(
    { limit: 20, ...getQueryParams(filter) },
    { enabled: open },
  );

  const markAsRead = clientApi.notification.markAsRead.useMutation({
    onSuccess: () => {
      void utils.notification.unreadCount.invalidate();
      void utils.notification.list.invalidate();
    },
  });

  const markAsUnread = clientApi.notification.markAsUnread.useMutation({
    onSuccess: () => {
      void utils.notification.unreadCount.invalidate();
      void utils.notification.list.invalidate();
    },
  });

  const markAllAsRead = clientApi.notification.markAllAsRead.useMutation({
    onSuccess: () => {
      void utils.notification.unreadCount.invalidate();
      void utils.notification.list.invalidate();
    },
  });

  const archive = clientApi.notification.archive.useMutation({
    onSuccess: () => {
      void utils.notification.unreadCount.invalidate();
      void utils.notification.list.invalidate();
    },
  });

  const unarchive = clientApi.notification.unarchive.useMutation({
    onSuccess: () => {
      void utils.notification.unreadCount.invalidate();
      void utils.notification.list.invalidate();
    },
  });

  const archiveAll = clientApi.notification.archiveAll.useMutation({
    onSuccess: () => {
      void utils.notification.unreadCount.invalidate();
      void utils.notification.list.invalidate();
    },
  });

  const handleNotificationClick = (
    notificationId: string,
    linkUrl?: string | null,
  ) => {
    markAsRead.mutate({ notificationId });
    if (linkUrl) {
      router.push(linkUrl as Route);
    }
    setOpen(false);
  };

  const handleArchive = (notificationId: string) => {
    archive.mutate({ notificationId });
  };

  const handleUnarchive = (notificationId: string) => {
    unarchive.mutate({ notificationId });
  };

  const handleToggleRead = (notificationId: string) => {
    const item = items.find((n) => n.id === notificationId);
    if (item?.read) {
      markAsUnread.mutate({ notificationId });
    } else {
      markAsRead.mutate({ notificationId });
    }
  };

  const items = data?.items ?? [];

  // Group into time buckets
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const sevenDaysAgo = new Date(startOfToday);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const groups: { label: string; items: typeof items }[] = [];
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

  const isArchivedView = filter === "archived";
  const hasUnread = items.some((n) => !n.read);
  const hasItems = items.length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative"
          startIcon={<Inbox className="size-5" />}
        >
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 size-2 rounded-full bg-red-500" />
          )}
          Notifications
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="bottom"
        className="w-96 p-0 overflow-hidden rounded-lg"
        sideOffset={8}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b p-1">
          <h3 className="pl-3 text-sm font-semibold">Notifications</h3>
          <div className="flex items-center gap-0.5">
            {/* Filter dropdown */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  tooltip="Filter"
                  startIcon={<ListFilter />}
                ></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Filter</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(["all", "unread", "archived"] as const).map((f) => (
                  <DropdownMenuCheckboxItem
                    key={f}
                    checked={filter === f}
                    onCheckedChange={() => setFilter(f)}
                  >
                    {filterLabels[f]}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* More actions dropdown */}
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
                  disabled={
                    markAllAsRead.isPending || isArchivedView || !hasUnread
                  }
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
          </div>
        </div>

        {/* Notification list */}
        <ScrollArea className="max-h-96">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-muted-foreground">
                {emptyMessages[filter]}
              </p>
            </div>
          ) : (
            <div>
              {groups.map((group) => (
                <div key={group.label}>
                  {groups.length > 1 && (
                    <p className="px-4 py-1.5 text-xs font-medium text-muted-foreground">
                      {group.label}
                    </p>
                  )}
                  <div className="divide-y">
                    {group.items.map((n) => (
                      <NotificationItem
                        key={n.id}
                        notification={n}
                        onClick={() => handleNotificationClick(n.id, n.linkUrl)}
                        onArchive={handleArchive}
                        onUnarchive={handleUnarchive}
                        onToggleRead={handleToggleRead}
                        isArchivedView={isArchivedView}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
