"use client";

import {
  PageLayout,
  PageLayoutHeader,
  PageLayoutHeaderContent,
  PageLayoutHeaderTitle,
  PageLayoutContent,
} from "@/components/page-layout";
import { Button } from "@/components/primitives/button";
import { Calendar } from "@/components/primitives/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/primitives/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/primitives/select";
import {
  Tabs,
  TabsContent,
} from "@/components/primitives/tabs";
import { TypographySmall, TypographyTitle } from "@/components/primitives/typography";
import { ShiftCard, type ScheduleShift } from "@/components/schedule/shift-card";
import { cn } from "@/lib/utils";
import { CalendarRange, List } from "lucide-react";
import {
  compareAsc,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfToday,
} from "date-fns";
import { useEffect, useMemo, useState } from "react";

type StatusFilter = "all" | "mine" | "requested" | "needs";

const STATUS_FILTERS: Array<{
  id: StatusFilter;
  label: string;
  dotClass: string;
  dotColor: string;
  description?: string;
}> = [
  { id: "all", label: "All Shifts", dotClass: "bg-muted-foreground/50", dotColor: "var(--color-muted-foreground)" },
  { id: "mine", label: "My Shifts", dotClass: "bg-success", dotColor: "var(--color-success)" },
  {
    id: "requested",
    label: "Requested Coverage",
    dotClass: "bg-amber-400",
    dotColor: "#f59e0b",
  },
  { id: "needs", label: "Needs Coverage", dotClass: "bg-destructive", dotColor: "var(--color-destructive)" },
];

// TODO: replace mock data with clientApi.shift.list when #107 is available.
const MOCK_SHIFTS: ScheduleShift[] = [
  {
    id: "1",
    title: "Art from the Heart",
    description: "Create with residents while guiding a light craft activity.",
    location: "Community Hall A",
    start: "2025-11-27T09:00:00",
    end: "2025-11-27T10:30:00",
    status: "checked_in",
    isMine: true,
    accent: "primary",
  },
  {
    id: "2",
    title: "Higher Intensity Interval Training",
    description: "Interval-based chair workout with music.",
    location: "Studio 2",
    start: "2025-11-27T09:30:00",
    end: "2025-11-27T10:30:00",
    status: "upcoming",
    isMine: true,
  },
  {
    id: "3",
    title: "Higher Intensity Chair Exercise",
    description: "Assist instructor with form checks and water breaks.",
    location: "Gym Floor",
    start: "2025-11-27T10:30:00",
    end: "2025-11-27T11:30:00",
    status: "needs_coverage",
    isMine: false,
    accent: "rose",
  },
  {
    id: "4",
    title: "Artful Living",
    description: "Help set up easels, brushes, and assist with cleanup.",
    location: "Studio 1",
    start: "2025-11-27T11:00:00",
    end: "2025-11-27T12:30:00",
    status: "requesting_coverage",
    isMine: true,
    accent: "amber",
  },
  {
    id: "5",
    title: "Strength & Balance Level 2",
    description: "Spot participants during balance circuits.",
    location: "Studio 2",
    start: "2025-11-27T12:30:00",
    end: "2025-11-27T13:00:00",
    status: "upcoming",
    isMine: true,
  },
  {
    id: "6",
    title: "Think, Feel, Dance",
    description: "Support choreography practice and cool-down.",
    location: "Dance Room",
    start: "2025-11-27T14:30:00",
    end: "2025-11-27T15:30:00",
    status: "needs_coverage",
    isMine: false,
  },
  {
    id: "7",
    title: "Book Club",
    description: "Facilitate discussion and take attendance.",
    location: "Library",
    start: "2025-11-28T10:00:00",
    end: "2025-11-28T11:00:00",
    status: "needs_coverage",
    isMine: false,
    accent: "rose",
  },
  {
    id: "8",
    title: "Gentle Stretch",
    description: "Lead warm-ups and manage sign-in sheet.",
    location: "Studio 3",
    start: "2025-12-03T08:30:00",
    end: "2025-12-03T09:30:00",
    status: "upcoming",
    isMine: true,
    accent: "primary",
  },
  {
    id: "9",
    title: "Community Lunch",
    description: "Prep tables and welcome guests.",
    location: "Café",
    start: "2025-12-15T11:30:00",
    end: "2025-12-15T12:30:00",
    status: "requesting_coverage",
    isMine: true,
    accent: "amber",
  },
];

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

  return Array.from(groups.values()).sort((a, b) =>
    compareAsc(a.date, b.date),
  );
}

export default function SchedulePage() {
  const initialMonth = useMemo(() => {
    const uniqueMonths = new Set<string>();
    MOCK_SHIFTS.forEach((shift) => {
      uniqueMonths.add(format(parseISO(shift.start), "yyyy-MM"));
    });
    return uniqueMonths.values().next().value ?? format(startOfToday(), "yyyy-MM");
  }, []);

  const [view, setView] = useState<"list" | "calendar">("list");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [monthKey, setMonthKey] = useState<string>(initialMonth);
  const [selectedDate, setSelectedDate] = useState<Date>(
    startOfMonth(parseISO(`${initialMonth}-01T00:00:00`)),
  );

  const availableMonths = useMemo(() => {
    const months = new Map<string, Date>();
    if (MOCK_SHIFTS.length === 0) {
      const today = startOfToday();
      months.set(format(today, "yyyy-MM"), startOfMonth(today));
    }
    MOCK_SHIFTS.forEach((shift) => {
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
      compareAsc(
        parseISO(`${a}-01T00:00:00`),
        parseISO(`${b}-01T00:00:00`),
      ),
    );
  }, [availableMonths, monthKey]);

  const filteredShifts = useMemo(() => {
    return MOCK_SHIFTS.filter((shift) => {
      if (statusFilter === "mine") return shift.isMine;
      if (statusFilter === "requested")
        return shift.status === "requesting_coverage";
      if (statusFilter === "needs") return shift.status === "needs_coverage";
      return true;
    }).sort((a, b) => compareAsc(parseISO(a.start), parseISO(b.start)));
  }, [statusFilter]);

  const monthStart = useMemo(
    () => startOfMonth(parseISO(`${monthKey}-01T00:00:00`)),
    [monthKey],
  );

  const monthShifts = useMemo(
    () =>
      filteredShifts.filter((shift) =>
        isSameMonth(parseISO(shift.start), monthStart),
      ),
    [filteredShifts, monthStart],
  );

  useEffect(() => {
    if (
      !selectedDate ||
      !isSameMonth(selectedDate, monthStart) ||
      !monthShifts.some((shift) => isSameDay(parseISO(shift.start), selectedDate))
    ) {
      const nextDate = monthShifts[0]
        ? parseISO(monthShifts[0].start)
        : monthStart;
      setSelectedDate(nextDate);
    }
  }, [monthShifts, monthStart, selectedDate]);

  const dayGroups = useMemo(() => groupByDay(monthShifts), [monthShifts]);
  const selectedDayShifts = useMemo(
    () =>
      monthShifts.filter((shift) => isSameDay(parseISO(shift.start), selectedDate)),
    [monthShifts, selectedDate],
  );
  const viewOptions: Array<{ value: "list" | "calendar"; label: React.ReactNode }> = [
    {
      value: "list",
      label: (
        <span className="flex items-center gap-2">
          <List className="size-4" />
          List
        </span>
      ),
    },
    {
      value: "calendar",
      label: (
        <span className="flex items-center gap-2">
          <CalendarRange className="size-4" />
          Calendar
        </span>
      ),
    },
  ];

  const containerClass = "mx-auto w-full max-w-3xl";

  return (
    <PageLayout className="overflow-hidden">
      <Tabs
        value={view}
        onValueChange={(value) => setView(value as "list" | "calendar")}
        className="h-full"
      >
        <PageLayoutHeader border="never">
          <PageLayoutHeaderContent className="justify-center pb-3">
            <div className="flex w-full flex-col gap-3 px-5">
              <div className="flex items-center">
                <PageLayoutHeaderTitle className="text-2xl font-semibold">
                  Schedule
                </PageLayoutHeaderTitle>
              </div>

              <div className="flex w-full flex-wrap items-center gap-4">
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

                <div className="flex items-center gap-2 ml-auto justify-end">
                  <Select
                    value={view}
                    onValueChange={(value) => setView(value as "list" | "calendar")}
                  >
                    <SelectTrigger className="w-[160px] rounded-xl">
                      <SelectValue placeholder="View" />
                    </SelectTrigger>
                    <SelectContent>
                      {viewOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* <div className="flex w-full flex-wrap items-center gap-2">
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
          </PageLayoutHeaderContent>
        </PageLayoutHeader>

        <PageLayoutContent
          className={cn(
            "px-5",
            "max-h-[calc(100dvh-var(--page-header-h))]",
            "flex justify-center",
          )}
        >
          <div className={cn(containerClass, "py-4")}>
            <TabsContent
              value="list"
              forceMount
              className={cn(view !== "list" && "hidden")}
            >
              <div className="space-y-6 pb-18">
                {dayGroups.length === 0 && (
                  <Card className="border-dashed">
                    <CardContent className="py-8">
                      <CardTitle>No shifts found</CardTitle>
                      <CardDescription>
                        Try a different month or clear the filters. Mock data is shown until the shifts query is wired.
                      </CardDescription>
                    </CardContent>
                  </Card>
                )}

                {dayGroups.map((group) => {
                  return (
                    <section key={group.date.toISOString()} className="space-y-3">
                      <div className="flex items-baseline gap-3 px-1">
                        {isToday(group.date) ? 
                          <TypographyTitle className="text-primary text-md">
                            {format(group.date, "EEE d") + " | Today"}
                          </TypographyTitle> :
                          <TypographyTitle className="text-md">
                            {format(group.date, "EEE d")}
                          </TypographyTitle>
                        }
                      </div>
                      <div className="flex flex-col gap-3 w-9/10 pl-5">
                        {group.shifts.map((shift) => (
                          <ShiftCard variant="compact" key={shift.id} shift={shift} />
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent
              value="calendar"
              forceMount
              className={cn(view !== "calendar" && "hidden")}
            >
              <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
                <Card className="h-fit">
                  <CardContent className="space-y-4 pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Calendar</CardTitle>
                        <CardDescription>Dots show days with shifts.</CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const today = startOfToday();
                          setMonthKey(format(today, "yyyy-MM"));
                          setSelectedDate(today);
                        }}
                      >
                        Today
                      </Button>
                    </div>

                    <Calendar
                      mode="single"
                      month={monthStart}
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      onMonthChange={(date) =>
                        setMonthKey(format(startOfMonth(date), "yyyy-MM"))
                      }
                      modifiers={{
                        hasShift: monthShifts.map((shift) =>
                          parseISO(shift.start),
                        ),
                      }}
                      modifiersClassNames={{
                        hasShift:
                          "after:absolute after:bottom-1 after:left-1/2 after:h-1.5 after:w-1.5 after:-translate-x-1/2 after:rounded-full after:bg-primary",
                      }}
                    />
                  </CardContent>
                </Card>

                <div className="space-y-3">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <TypographyTitle>
                        {format(selectedDate ?? monthStart, "EEEE, MMM d")}
                      </TypographyTitle>
                      <TypographySmall className="text-muted-foreground">
                        {format(selectedDate ?? monthStart, "yyyy")}
                      </TypographySmall>
                    </div>
                    <TypographySmall className="text-muted-foreground">
                      {selectedDayShifts.length} shift
                      {selectedDayShifts.length === 1 ? "" : "s"}
                    </TypographySmall>
                  </div>

                  {selectedDayShifts.length === 0 ? (
                    <Card className="border-dashed">
                      <CardContent className="py-8">
                        <CardTitle>No shifts this day</CardTitle>
                        <CardDescription>
                          Pick another date to see scheduled shifts.
                        </CardDescription>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {selectedDayShifts.map((shift) => (
                        <ShiftCard key={shift.id} shift={shift} variant="compact" />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </div>
        </PageLayoutContent>
      </Tabs>
    </PageLayout>
  );
}
