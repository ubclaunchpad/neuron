"use client";

import { useState, useRef, useEffect } from "react";
import { Inbox } from "lucide-react";
import { Button } from "@/components/primitives/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { clientApi } from "@/trpc/client";
import { cn } from "@/lib/utils";
import { NotificationFilterMenu } from "./notification-filter-menu";
import { NotificationActionsMenu } from "./notification-actions-menu";
import { NotificationItem } from "./notification-item";
import {
  type Filter,
  getQueryParams,
  emptyMessages,
  groupByDate,
} from "./utils";

export function NotificationInbox() {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [stuckHeader, setStuckHeader] = useState<string | null>(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const sentinels = container.querySelectorAll("[data-header-sentinel]");
    if (sentinels.length === 0) return;

    const observer = new IntersectionObserver(
      () => {
        const containerRect = container.getBoundingClientRect();
        let topStuck: string | null = null;

        for (const sentinel of sentinels) {
          const rect = sentinel.getBoundingClientRect();
          const isAboveViewport = rect.top < containerRect.top;
          if (isAboveViewport) {
            topStuck = (sentinel as HTMLElement).dataset.headerSentinel ?? null;
          }
        }

        setStuckHeader(topStuck);
      },
      { root: container, threshold: 0 },
    );

    sentinels.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  });

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

  const items = data?.items ?? [];
  const groups = groupByDate(items);
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
        <div className="flex items-center justify-between px-1 pt-1">
          <h3 className="pl-2 text-sm font-semibold">Notifications</h3>
          <div className="flex items-center gap-0.5">
            <NotificationFilterMenu
              filter={filter}
              onFilterChange={setFilter}
            />
            <NotificationActionsMenu
              isArchivedView={isArchivedView}
              hasUnread={hasUnread}
              hasItems={hasItems}
            />
          </div>
        </div>

        {/* Notification list */}
        <div ref={scrollContainerRef} className="max-h-96 overflow-y-auto">
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
                  <div
                    data-header-sentinel={group.label}
                    className="h-0"
                    aria-hidden="true"
                  />
                  <p
                    className={cn(
                      "sticky top-0 z-20 bg-popover px-3 py-1.5 text-xs font-medium text-muted-foreground",
                      "before:absolute before:inset-x-0 before:-top-px before:h-px before:bg-popover",
                      stuckHeader === group.label && "shadow-bottom",
                    )}
                  >
                    {group.label}
                  </p>
                  <div className="divide-y">
                    {group.items.map((n) => (
                      <NotificationItem
                        key={n.id}
                        notification={n}
                        isArchivedView={isArchivedView}
                        onClose={() => setOpen(false)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
