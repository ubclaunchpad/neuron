"use client";

import { CoverageItem } from "./coverage-item";
import { ListLoadingState, ListStateWrapper } from "@/components/members/list";
import { TypographyTitle } from "@/components/ui/typography";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import { useMemo, useEffect, useRef } from "react";
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
    },
  );

  const handleScroll = useInfiniteScroll(infiniteQuery);

  const pages = infiniteQuery.data?.pages;

  const sortedItems = useMemo(() => {
    const items = pages?.flatMap((page) => page.data) ?? [];
    return [...items].sort(
      (a, b) =>
        toDate(a.shift.startAt).getTime() - toDate(b.shift.startAt).getTime(),
    );
  }, [pages]);

  const dayGroups = useMemo(() => groupByDay(sortedItems), [sortedItems]);

  const prevItemIds = useRef<string>("");
  useEffect(() => {
    const itemIds = sortedItems.map((i) => i.id).join(",");
    if (itemIds !== prevItemIds.current) {
      prevItemIds.current = itemIds;
      setSortedItems(sortedItems);
    }
  }, [sortedItems, setSortedItems]);

  const isLoading = infiniteQuery.isLoading;
  const isEmpty = !isLoading && sortedItems.length === 0;
  const showNoMoreResults =
    !isLoading && sortedItems.length > 0 && !infiniteQuery.hasNextPage;

  const handleItemClick = (item: CoverageListItem) => {
    openAsideFor(item);
  };

  return (
    <ScrollArea onScroll={handleScroll} className="w-full h-full">
      <div className="px-10 py-4 space-y-4">
        {isLoading && <ListLoadingState />}

        {isEmpty && (
          <ListStateWrapper>No coverage requests found.</ListStateWrapper>
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

        {infiniteQuery.isFetchingNextPage && <ListLoadingState />}

        {showNoMoreResults && (
          <ListStateWrapper>No more results</ListStateWrapper>
        )}
      </div>
    </ScrollArea>
  );
}
