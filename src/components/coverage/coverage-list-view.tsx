"use client";

import { CoverageItem } from "./coverage-item";
import { TypographyTitle } from "@/components/ui/typography";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { format, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import { useMemo, useEffect } from "react";
import {
  useCoveragePage,
  type CoverageListItem,
} from "./coverage-page-context";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { clientApi } from "@/trpc/client";

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

function groupByDay(items: CoverageListItem[]) {
  const groups = new Map<string, { date: Date; items: CoverageListItem[] }>();

  items.forEach((item) => {
    const start = toDate(item.shift.startAt);
    const key = format(start, "yyyy-MM-dd");
    const group = groups.get(key) ?? { date: start, items: [] };
    group.items.push(item);
    groups.set(key, group);
  });

  return Array.from(groups.values()).sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );
}

export function CoverageListView() {
  const { openAsideFor, setSortedItems } = useCoveragePage();

  const infiniteQuery = clientApi.coverage.list.useInfiniteQuery(
    {},
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      placeholderData: (prev) => prev,
      select: (data) => ({
        ...data,
        items: data.pages.flatMap((page) => page.data) ?? [],
      }),
    },
  );

  const handleScroll = useInfiniteScroll(infiniteQuery);

  const items = infiniteQuery.data?.items ?? [];

  const sortedItems = useMemo(() => {
    return [...items].sort(
      (a, b) =>
        toDate(a.shift.startAt).getTime() - toDate(b.shift.startAt).getTime(),
    );
  }, [items]);

  const dayGroups = useMemo(() => groupByDay(sortedItems), [sortedItems]);

  useEffect(() => {
    setSortedItems(sortedItems);
  }, [sortedItems, setSortedItems]);

  const isLoading = infiniteQuery.isLoading;
  const isEmpty = !isLoading && items.length === 0;
  const showNoMoreResults =
    !isLoading && items.length > 0 && !infiniteQuery.hasNextPage;

  const handleItemClick = (item: CoverageListItem) => {
    openAsideFor(item);
  };

  return (
    <ScrollArea onScroll={handleScroll} className="w-full h-full">
      <div className="px-10 py-4 space-y-4">
        {isLoading && (
          <div className="flex justify-center py-10">
            <Spinner className="size-6" />
          </div>
        )}

        {isEmpty && (
          <div className="text-center text-muted-foreground py-10">
            No coverage requests found.
          </div>
        )}

        {dayGroups.map((group) => {
          const groupIsToday = isToday(group.date);
          return (
            <section key={group.date.toISOString()} className="space-y-3">
              <div className="pt-3 pb-2">
                <TypographyTitle
                  className={cn("text-md", groupIsToday && "text-primary")}
                >
                  {format(group.date, "EEE d")}
                  {groupIsToday && " | Today"}
                </TypographyTitle>
              </div>
              <div className="flex flex-col gap-3 px-5">
                {group.items.map((item) => (
                  <CoverageItem
                    key={item.id}
                    item={item}
                    onSelect={handleItemClick}
                  />
                ))}
              </div>
            </section>
          );
        })}

        {infiniteQuery.isFetchingNextPage && (
          <div className="flex justify-center py-4">
            <Spinner className="size-5" />
          </div>
        )}

        {showNoMoreResults && (
          <div className="text-center text-muted-foreground py-4 text-sm">
            No more results
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
