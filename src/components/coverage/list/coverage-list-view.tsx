"use client";

import { CoverageItem } from "./components/coverage-item";
import { ListLoadingState, ListStateWrapper } from "@/components/members/list";
import { TypographyTitle } from "@/components/ui/typography";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import { useMemo, useEffect, useRef } from "react";
import { useCoveragePage } from "./coverage-page-context";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { clientApi } from "@/trpc/client";
import { buildFilterInput } from "@/components/coverage/filters/utils";
import { useCoverageFilterParams } from "@/components/coverage/filters/hooks/use-coverage-filter-params";
import { groupCoverageItemsByDay } from "./utils";
import { skeletonListGroup } from "@/components/ui/skeleton";

export function CoverageListView() {
  const { setSortedItems } = useCoveragePage();
  const { tab, filters } = useCoverageFilterParams();
  const filterInput = useMemo(
    () => buildFilterInput(tab, filters),
    [tab, filters],
  );

  const infiniteQuery = clientApi.coverage.list.useInfiniteQuery(filterInput, {
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    placeholderData: (prev) => prev,
  });

  const handleScroll = useInfiniteScroll(infiniteQuery);

  const items = useMemo(
    () => infiniteQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [infiniteQuery.data],
  );

  const dayGroups = useMemo(() => groupCoverageItemsByDay(items), [items]);

  const prevItemIds = useRef<string>("");
  useEffect(() => {
    const itemIds = items.map((i) => i.id).join(",");
    if (itemIds !== prevItemIds.current) {
      prevItemIds.current = itemIds;
      setSortedItems(items);
    }
  }, [items, setSortedItems]);

  const isLoading = infiniteQuery.isLoading;
  const isEmpty = !isLoading && items.length === 0;
  const showNoMoreResults =
    !isLoading && items.length > 0 && !infiniteQuery.hasNextPage;

  return (
    <ScrollArea onScroll={handleScroll} className="w-full h-full">
      <div className="px-10 py-4 space-y-4">
        
      {isLoading && (
        <>
          {skeletonListGroup({
            containerClassName: "space-y-3",
            titleContainerClassName: "pt-3 pb-2",
            titleClassName: "h-6 w-31",
            itemContainerClassName: "flex flex-col gap-3 px-5",
            itemClassName: "w-full h-22",
          })}
        </>
      )}

        {isEmpty && (
          <ListStateWrapper>No coverage requests found.</ListStateWrapper>
        )}

        {dayGroups.map((group, index) => {
          const previousGroup = dayGroups[index - 1];
          const showMonth =
            !previousGroup ||
            previousGroup.date.getMonth() !== group.date.getMonth() ||
            previousGroup.date.getFullYear() !== group.date.getFullYear();
          const groupIsToday = isToday(group.date);
          return (
            <section key={group.date.toISOString()} className="space-y-3">
              <div className="pt-3 pb-2">
                <TypographyTitle
                  className={cn("text-md", groupIsToday && "text-primary")}
                >
                  {format(group.date, showMonth ? "EEE, MMM d" : "EEE d")}
                  {groupIsToday && " | Today"}
                </TypographyTitle>
              </div>
              <div className="flex flex-col gap-3 px-5">
                {group.items.map((item) => (
                  <CoverageItem key={item.id} coverageRequest={item} />
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
