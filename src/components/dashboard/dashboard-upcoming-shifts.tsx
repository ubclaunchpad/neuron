"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SkeletonListGroup } from "@/components/ui/skeleton";
import { ShiftItem } from "@/components/schedule/shift-item";
import { ShiftItemSkeleton } from "@/components/schedule/shift-item-skeleton";
import { useShiftRange } from "@/components/schedule/hooks/use-shift-range";
import type { ListShift } from "@/models/shift";
import { endOfMonth, format, isToday, startOfMonth } from "date-fns";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useCurrentTime } from "@/hooks/use-current-time";

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

type DayGroup = { date: Date; shifts: ListShift[] };

function groupByDay(shifts: ListShift[]): DayGroup[] {
  const groups = new Map<string, DayGroup>();
  shifts.forEach((shift) => {
    const start = toDate(shift.startAt);
    const key = format(start, "yyyy-MM-dd");
    const group = groups.get(key) ?? { date: start, shifts: [] };
    group.shifts.push(shift);
    groups.set(key, group);
  });
  return Array.from(groups.values());
}

export function DashboardUpcomingShifts() {
  const router = useRouter();
  const now = useCurrentTime();
  const rangeStart = useMemo(() => startOfMonth(now), [now]);
  const rangeEnd = useMemo(() => endOfMonth(now), [now]);

  const { shifts, query } = useShiftRange({
    start: rangeStart,
    end: rangeEnd,
    enabled: true,
  });

  const upcomingShifts = useMemo(
    () => shifts.filter((s) => toDate(s.endAt) >= now).slice(0, 7),
    [shifts, now],
  );

  const dayGroups = useMemo(() => groupByDay(upcomingShifts), [upcomingShifts]);

  const handleOpen = (shiftId: string) => {
    router.push(`/schedule?shiftId=${shiftId}&view=list`);
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-2">
        <Link
            href="/schedule"
            className="flex items-center gap-1"
          >
          <CardTitle className="text-base font-semibold">My Upcoming Shifts</CardTitle>
          <ChevronRight className="size-4 text-muted-foreground" />
        </Link>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 overflow-y-auto">
        {query.isLoading ? (
          <SkeletonListGroup
            containerClassName="space-y-3"
            titleContainerClassName="pt-3 pb-2"
            titleClassName="h-6 w-31"
            itemContainerClassName="flex flex-col gap-3 px-5"
            itemRenderer={() => <ShiftItemSkeleton />}
          />
        ) : dayGroups.length === 0 ? (
          <div className="flex items-center justify-center h-20 text-sm text-muted-foreground">
            No upcoming shifts
          </div>
        ) : (
          <div className="space-y-3">
            {dayGroups.map((group) => (
              <div key={group.date.toISOString()}>
                <div className="flex items-center gap-2 mb-1 px-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    {format(group.date, "MMM d")}
                  </span>
                  {isToday(group.date) && (
                    <span className="text-xs font-semibold text-primary">Today</span>
                  )}
                </div>
                <div className="space-y-0.5">
                  {group.shifts.map((shift) => (
                    <ShiftItem key={shift.id} shift={shift} onOpen={handleOpen} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}