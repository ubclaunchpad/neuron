"use client";

import { ShiftItem } from "@/components/schedule/shift-item";
import { useShiftRange } from "@/components/schedule/use-shift-range";
import { ListLoadingState, ListStateWrapper } from "@/components/members/list";
import { TypographyTitle } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import {
  compareAsc,
  endOfMonth,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
} from "date-fns";
import { useMemo } from "react";
import { useSchedulePage } from "./schedule-page-context";
import type { ListShift } from "@/models/shift";

type StatusFilter = "all" | "mine" | "requested" | "needs";

// const STATUS_FILTERS: Array<{
//   id: StatusFilter;
//   label: string;
//   dotClass: string;
//   dotColor: string;
//   description?: string;
// }> = [
//   { id: "all", label: "All Shifts", dotClass: "bg-muted-foreground/50", dotColor: "var(--color-muted-foreground)" },
//   { id: "mine", label: "My Shifts", dotClass: "bg-success", dotColor: "var(--color-success)" },
//   {
//     id: "requested",
//     label: "Requested Coverage",
//     dotClass: "bg-amber-400",
//     dotColor: "#f59e0b",
//   },
//   { id: "needs", label: "Needs Coverage", dotClass: "bg-destructive", dotColor: "var(--color-destructive)" },
// ];

type DayGroup = { date: Date; shifts: ListShift[] };

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

function groupByDay(shifts: ListShift[]): DayGroup[] {
  const groups = new Map<string, DayGroup>();

  shifts.forEach((shift) => {
    const start = toDate(shift.startAt);
    const key = format(start, "yyyy-MM-dd");
    const group = groups.get(key) ?? { date: start, shifts: [] };
    group.shifts.push(shift);
    groups.set(key, group);
  });

  return Array.from(groups.values()).sort((a, b) => compareAsc(a.date, b.date));
}

export function ScheduleListView({ className }: { className?: string }) {
  const statusFilter: StatusFilter = "all";
  const { selectedDate } = useSchedulePage();

  const rangeStart = useMemo(() => startOfMonth(selectedDate), [selectedDate]);
  const rangeEnd = useMemo(() => endOfMonth(rangeStart), [rangeStart]);

  const { shifts: rawShifts, query } = useShiftRange({
    start: rangeStart,
    end: rangeEnd,
    enabled: true,
  });

  const filteredShifts = useMemo(() => {
    return [...rawShifts].sort((a, b) =>
      compareAsc(toDate(a.startAt), toDate(b.startAt)),
    );
  }, [rawShifts, statusFilter]);

  const monthShifts = useMemo(
    () =>
      filteredShifts.filter((shift) =>
        isSameMonth(toDate(shift.startAt), rangeStart),
      ),
    [filteredShifts, rangeStart],
  );

  const dayGroups = useMemo(() => groupByDay(monthShifts), [monthShifts]);

  return (
    <div className="w-full px-10">
      <div className={cn("mx-auto max-w-3xl py-4", className)}>
        <div className="space-y-4 pb-18">
          {query.isLoading && <ListLoadingState />}

          {!query.isLoading && dayGroups.length === 0 && (
            <ListStateWrapper>No shifts found</ListStateWrapper>
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
                  {group.shifts.map((shift) => (
                    <ShiftItem key={shift.id} shift={shift} />
                  ))}
                </div>
              </section>
            );
          })}

          {!query.isLoading && dayGroups.length > 0 && (
            <ListStateWrapper>No more results</ListStateWrapper>
          )}
        </div>
      </div>
    </div>
  );
}

export default ScheduleListView;
