"use client";

import {
  ShiftCard,
  type ScheduleShift,
} from "@/components/schedule/shift-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TypographyTitle } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import {
  compareAsc,
  endOfMonth,
  format,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfToday,
} from "date-fns";
import { useMemo, useState } from "react";
import { useShiftRange } from "@/components/schedule/use-shift-range";
import { mapListShiftToScheduleShift } from "./shift-mappers";

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

type DayGroup = { date: Date; shifts: ScheduleShift[] };

function groupByDay(shifts: ScheduleShift[]): DayGroup[] {
  const groups = new Map<string, DayGroup>();

  shifts.forEach((shift) => {
    const start = parseISO(shift.start);
    const key = format(start, "yyyy-MM-dd");
    const group = groups.get(key) ?? { date: start, shifts: [] };
    group.shifts.push(shift);
    groups.set(key, group);
  });

  return Array.from(groups.values()).sort((a, b) => compareAsc(a.date, b.date));
}

export function ScheduleListView({
  className,
  onSelectShiftAction: onSelectShift,
}: {
  className?: string;
  onSelectShiftAction: (shiftId: string) => void;
}) {
  const today = startOfToday();
  const statusFilter: StatusFilter = "all";
  const [monthKey, setMonthKey] = useState<string>(format(today, "yyyy-MM"));

  const rangeStart = useMemo(
    () => startOfMonth(parseISO(`${monthKey}-01T00:00:00`)),
    [monthKey],
  );
  const rangeEnd = useMemo(() => endOfMonth(rangeStart), [rangeStart]);

  const { shifts: rawShifts, query } = useShiftRange({
    start: rangeStart,
    end: rangeEnd,
    enabled: true,
  });
  const mappedShifts = useMemo(
    () => rawShifts.map(mapListShiftToScheduleShift),
    [rawShifts],
  );

  const availableMonths = useMemo(() => {
    const months = new Map<string, Date>();
    if (mappedShifts.length === 0) {
      const today = startOfToday();
      months.set(format(today, "yyyy-MM"), startOfMonth(today));
    }
    mappedShifts.forEach((shift) => {
      const start = parseISO(shift.start);
      const key = format(start, "yyyy-MM");
      months.set(key, startOfMonth(start));
    });
    return Array.from(months.entries())
      .sort((a, b) => compareAsc(a[1], b[1]))
      .map(([key]) => key);
  }, []);

  const monthOptions = useMemo(() => {
    const combined = new Set<string>([...availableMonths, monthKey]);
    return Array.from(combined).sort((a, b) =>
      compareAsc(parseISO(`${a}-01T00:00:00`), parseISO(`${b}-01T00:00:00`)),
    );
  }, [availableMonths, monthKey]);

  const filteredShifts = useMemo(() => {
    return mappedShifts.sort((a, b) =>
      compareAsc(parseISO(a.start), parseISO(b.start)),
    );
  }, [mappedShifts, statusFilter]);

  const monthShifts = useMemo(
    () =>
      filteredShifts.filter((shift) =>
        isSameMonth(parseISO(shift.start), rangeStart),
      ),
    [filteredShifts, rangeStart],
  );

  const dayGroups = useMemo(() => groupByDay(monthShifts), [monthShifts]);

  const containerClass = cn("mx-auto w-full max-w-3xl", className);

  return (
    <div className="w-full px-5">
      <div className={cn(containerClass, "py-4")}>
        <div className="flex w-full flex-wrap items-center gap-4 pb-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Select
              value={monthKey}
              onValueChange={(value) => setMonthKey(value)}
            >
              <SelectTrigger className="w-[180px] rounded-xl">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((key) => {
                  const date = parseISO(`${key}-01T00:00:00`);
                  return (
                    <SelectItem key={key} value={key}>
                      {format(date, "MMMM yyyy")}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* <div className="flex flex-wrap items-center gap-2 ml-auto justify-end">
            <TypographySmall className="text-muted-foreground">
              Filter by Status:
            </TypographySmall>
            {STATUS_FILTERS.map((filter) => {
              const active = statusFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  onClick={() => setStatusFilter(filter.id)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-md border px-3 py-1 text-sm",
                    active
                      ? "bg-primary/10 border-primary text-foreground"
                      : "bg-muted border-input text-foreground hover:bg-accent",
                  )}
                >
                  <span
                    className={cn(
                      "size-2.5 rounded-full border",
                      active ? filter.dotClass : "bg-transparent",
                    )}
                    style={{
                      backgroundColor: active ? filter.dotColor : "transparent",
                      borderColor: filter.dotColor,
                    }}
                  />
                  {filter.label}
                </button>
              );
            })}
          </div> */}
        </div>

        <div className="space-y-6 pb-18">
          {query.isLoading && (
            <Card className="border-dashed">
              <CardContent className="py-8">
                <CardTitle>Loading shifts…</CardTitle>
                <CardDescription>
                  Fetching your schedule for this month.
                </CardDescription>
              </CardContent>
            </Card>
          )}

          {!query.isLoading && dayGroups.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-8">
                <CardTitle>No shifts found</CardTitle>
                <CardDescription>
                  Try a different month or clear the filters.
                </CardDescription>
              </CardContent>
            </Card>
          )}

          {dayGroups.map((group) => {
            return (
              <section key={group.date.toISOString()} className="space-y-3">
                <div className="flex items-baseline gap-3 px-1">
                  {isToday(group.date) ? (
                    <TypographyTitle className="text-primary text-md">
                      {format(group.date, "EEE d") + " | Today"}
                    </TypographyTitle>
                  ) : (
                    <TypographyTitle className="text-md">
                      {format(group.date, "EEE d")}
                    </TypographyTitle>
                  )}
                </div>
                <div className="flex flex-col gap-3 w-9/10 pl-5">
                  {group.shifts.map((shift) => (
                    <ShiftCard
                      variant="compact"
                      key={shift.id}
                      shift={shift}
                      onSelect={() => onSelectShift(shift.id)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ScheduleListView;
