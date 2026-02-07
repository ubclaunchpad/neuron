"use client";

import { useAuth } from "@/providers/client-auth-provider";
import { Role } from "@/models/interfaces";
import { CoverageItem } from "./coverage-item";
import { TypographyTitle } from "@/components/ui/typography";
import { format, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import { useMemo, useEffect } from "react";
import { CoverageStatus } from "@/models/api/coverage";
import { useCoveragePage } from "./coverage-page-context";
import type { CoverageRequest } from "@/models/coverage";
import { mockCoverageRequests } from "./mock-data";

type CoverageListViewProps = {
  selectedDate?: Date  // Optional, if passed in, will only show items from the same month
}

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

function groupByDay(items: CoverageRequest[]) {
  const groups = new Map<string, { date: Date; items: CoverageRequest[] }>();

  items.forEach((item) => {
    const start = toDate(item.shift.startAt);
    const key = format(start, "yyyy-MM-dd");
    const group = groups.get(key) ?? { date: start, items: [] };
    group.items.push(item);
    groups.set(key, group);
  });

  return Array.from(groups.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function CoverageListView(
  { selectedDate }: CoverageListViewProps
) {
  const { user } = useAuth();
  const { openAsideFor, setSortedItems } = useCoveragePage();
  
  const items = useMemo(() => {
    if (!user) return [];
    return mockCoverageRequests;
  }, [user]);

  const filteredItems = useMemo(() => {
      const inSelectedMonth = (item: CoverageRequest) => {
        if (!selectedDate) return true;

        const start = toDate(item.shift.startAt);
        return (
          start.getFullYear() === selectedDate.getFullYear() &&
          start.getMonth() === selectedDate.getMonth()
        );
      };

      if (!user) return [];
      if (user.role === Role.admin) {
        console.log("User role is ", user.role);
        return items.filter(item => inSelectedMonth(item));
      } else {
        // Volunteers see for the month:
        // 1. All shifts up for coverage (status = open)
        // 2. Their own shifts that were taken (my request AND status = resolved)
        // "Volunteers do not see why a shift was put up for coverage on the sidebar" (handled in CoverageItem by not showing details)
          
        const filteredItems: CoverageRequest[] = items.filter((item: CoverageRequest) => {
          if (!inSelectedMonth(item)) return false;
          if (item.status === CoverageStatus.open) return true;
          if (item.requestingVolunteer.id === user.id && item.status === CoverageStatus.resolved) return true;
          return false;
        });

        return filteredItems.map((item: CoverageRequest) => ({
          ...item,
          details: item.requestingVolunteer.id === user.id ? item.details : '',
          comments: item.requestingVolunteer.id == user.id ? item.comments : undefined,
        }));
      }
  }, [selectedDate, items, user]);

  const sortedItems = useMemo(() => {
    return [...filteredItems].sort(
      (a, b) =>
        toDate(a.shift.startAt).getTime() -
        toDate(b.shift.startAt).getTime()
    );
  }, [filteredItems]);

  const dayGroups = useMemo(
    () => groupByDay(sortedItems),
    [sortedItems]
  );

  useEffect(() => {
    setSortedItems(sortedItems);
  }, [sortedItems, setSortedItems]);

  if (!user) return null;

  const handleItemClick = (item: CoverageRequest) => {
    openAsideFor(item);
  };

  return (
    <div className="w-full px-10">
      <div className="py-4 space-y-4">
        {filteredItems.length === 0 && (
          <div className="text-center text-muted-foreground py-10">No coverage requests found.</div>
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
                  {group.items.map((item) => {
                    return (
                      <CoverageItem 
                        key={item.id} 
                        item={item} 
                        onSelect={handleItemClick}
                      />)
                  })}
                </div>
              </section>
            );
          })}
      </div>
    </div>
  );
}
