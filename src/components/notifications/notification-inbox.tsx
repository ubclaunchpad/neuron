"use client";

import { Inbox } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { clientApi } from "@/trpc/client";
import { NotificationItem } from "./notification-item";
import { useState } from "react";

export function NotificationInbox() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const utils = clientApi.useUtils();

  const { data: unreadCount = 0 } =
    clientApi.notification.unreadCount.useQuery(undefined, {
      refetchInterval: 30_000,
    });

  const { data, isLoading } = clientApi.notification.list.useQuery(
    { limit: 20 },
    { enabled: open },
  );

  const markAsRead = clientApi.notification.markAsRead.useMutation({
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

  const handleNotificationClick = (notificationId: string, linkUrl?: string | null) => {
    markAsRead.mutate({ notificationId });
    if (linkUrl) {
      router.push(linkUrl as any);
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-10 w-10">
          <Inbox className="size-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 size-2 rounded-full bg-red-500" />
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="right"
        className="w-96 p-0"
        sideOffset={8}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs"
              onClick={() => markAllAsRead.mutate()}
              disabled={markAllAsRead.isPending}
            >
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-96">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          ) : !data?.items.length ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-muted-foreground">
                You&apos;re all caught up
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {data.items.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onClick={() => handleNotificationClick(n.id, n.linkUrl)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
