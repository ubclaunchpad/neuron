"use client";

import { useAuth } from "@/providers/client-auth-provider";
import { Role } from "@/models/interfaces";
import { getMockCoverageRequests, type MockCoverageItem } from "./mock-data";
import { CoverageItem } from "./coverage-item";
import { TypographyTitle } from "@/components/ui/typography";
import { format, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { CoverageStatus } from "@/models/api/coverage";
import { useCoveragePage } from "./coverage-page-context";

type CoverageListViewProps = {
  date: Date
}

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

function groupByDay(items: MockCoverageItem[]) {
  const groups = new Map<string, { date: Date; items: MockCoverageItem[] }>();

  items.forEach((item) => {
    const start = toDate(item.startAt);
    const key = format(start, "yyyy-MM-dd");
    const group = groups.get(key) ?? { date: start, items: [] };
    group.items.push(item);
    groups.set(key, group);
  });

  return Array.from(groups.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function CoverageListView(
  { date }: CoverageListViewProps
) {
  const { user } = useAuth();
  const { openAsideFor } = useCoveragePage();
  
  const items = useMemo(() => {
    if (!user) return [];
    return getMockCoverageRequests(user.id);
  }, [user]);

  const filteredItems = useMemo(() => {
      if (!user) return [];
      if (user.role === Role.admin) {
          /// TODO: admins see all items in the selected month
          return items;
      } else {
          // Volunteers see for the month:
          // 1. All shifts up for coverage (status = open)
          // 2. Their own shifts that were taken (my request AND status = resolved)
          // "Volunteers do not see why a shift was put up for coverage on the sidebar" (handled in CoverageItem by not showing details)
          
          return items.filter(item => {
              if (item.coverageStatus === CoverageStatus.open) return true;
              if (item.requestingVolunteer.id === user.id && item.coverageStatus === CoverageStatus.resolved) return true;
              return false;
          });
      }
  }, [items, user]);

  const dayGroups = useMemo(() => groupByDay(filteredItems), [filteredItems]);

  if (!user) return null;

  const handleItemClick = (item: MockCoverageItem) => {
    openAsideFor(item);
  }

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
                  {group.items.map((item) => (
                    <CoverageItem 
                      key={item.coverageRequestId} 
                      item={item} 
                      onSelect={handleItemClick}
                    />
                  ))}
                </div>
              </section>
            );
          })}
      </div>
    </div>
  );
}
