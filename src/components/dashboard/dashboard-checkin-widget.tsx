"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { clientApi } from "@/trpc/client";
import { useShiftRange } from "@/components/schedule/hooks/use-shift-range";
import type { ListShiftWithPersonalStatus } from "@/models/shift";
import { AttendanceStatus } from "@/models/interfaces";
import { differenceInSeconds, format, subMinutes } from "date-fns";
import { startOfMonth, endOfMonth } from "date-fns";
import { ChevronRight, Clock } from "lucide-react";
import { useMemo } from "react";
import { useCurrentTime } from "@/hooks/use-current-time";

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

function useCountdownToDate(target: Date) {
  const now = useCurrentTime();
  const totalSeconds = Math.max(0, differenceInSeconds(target, now));
  const days = Math.floor(totalSeconds / (60 * 60 * 24));
  const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  return { days, hours, minutes, now };
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <span className="inline-flex items-baseline gap-1">
      <span className="font-display text-5xl font-light tabular-nums leading-none">
        {value}
      </span>
      <span className="text-sm text-muted-foreground">{label}</span>
    </span>
  );
}

function CheckInActiveCard({ shift }: { shift: ListShiftWithPersonalStatus }) {
  const apiUtils = clientApi.useUtils();
  const { mutate: checkIn, isPending } = clientApi.shift.checkIn.useMutation({
    onSuccess: (_, variables) => {
      void apiUtils.shift.list.invalidate();
      void apiUtils.shift.byId.invalidate({ shiftId: variables.shiftId });
    },
  });

  const startAt = toDate(shift.startAt);
  const endAt = toDate(shift.endAt);
  const hasCheckedIn =
    shift.attendance?.status === AttendanceStatus.present ||
    shift.attendance?.status === AttendanceStatus.late;

  if (hasCheckedIn) {
    return (
      <div className="h-full min-h-40 bg-success/10 rounded-xl flex flex-col items-center justify-center gap-2 p-6 text-center">
        <div className="size-10 rounded-full bg-success/20 flex items-center justify-center">
          <Clock className="size-5 text-success" />
        </div>
        <p className="font-semibold text-success">Checked In!</p>
        <p className="text-xs text-muted-foreground truncate max-w-full">
          {shift.className} • {format(startAt, "h:mm a")}–{format(endAt, "h:mm a")}
        </p>
      </div>
    );
  }

  return (
    <button
      className="h-full min-h-40 w-full bg-primary rounded-xl flex items-center justify-between px-6 py-5 text-primary-foreground hover:cursor-pointer hover:bg-primary/90 transition-colors group disabled:opacity-70"
      onClick={() => checkIn({ shiftId: shift.id })}
      disabled={isPending}
    >
      <div className="text-left">
        <p className="font-display text-xl leading-tight">Check In</p>
        <p className="text-sm text-primary-foreground/80 mt-1 truncate max-w-55">
          {shift.className} • {format(startAt, "h:mm a")}–{format(endAt, "h:mm a")}
        </p>
      </div>
      <ChevronRight className="size-6 shrink-0 opacity-80 group-hover:translate-x-1 transition-transform" />
    </button>
  );
}

function CountdownCard({ shift }: { shift: ListShiftWithPersonalStatus }) {
  const startAt = toDate(shift.startAt);
  const checkInOpensAt = subMinutes(startAt, 15);
  const { days, hours, minutes, now } = useCountdownToDate(checkInOpensAt);

  // Switch to check-in card once window opens
  if (now >= checkInOpensAt) {
    return <CheckInActiveCard shift={shift} />;
  }

  return (
    <div className="min-h-40 bg-muted rounded-xl flex flex-col justify-center items-center gap-3 px-6 py-16">
      <p className="text-sm font-medium text-muted-foreground">Next check-in</p>
      <div className="flex items-baseline gap-4 flex-wrap">
        <CountdownUnit value={days} label="days" />
        <CountdownUnit value={hours} label="hours" />
        <CountdownUnit value={minutes} label="minutes" />
      </div>
      <p className="text-xs text-muted-foreground truncate">
        {shift.className} • {format(startAt, "MMM d, h:mm a")}
      </p>
    </div>
  );
}

export function DashboardCheckInWidget() {
  const now = useCurrentTime();
  const rangeStart = useMemo(() => startOfMonth(now), [now]);
  const rangeEnd = useMemo(() => endOfMonth(now), [now]);

  const { shifts, query } = useShiftRange({
    start: rangeStart,
    end: rangeEnd,
    enabled: true,
  });

  // Find the earliest upcoming shift within 12 hours or currently active
  const relevantShift = useMemo(() => {
    const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
    return (shifts as ListShiftWithPersonalStatus[]).find((s) => {
      if (!("attendance" in s)) return false;
      const start = toDate(s.startAt);
      const end = toDate(s.endAt);
      const msUntilStart = start.getTime() - now.getTime();
      return end > now && msUntilStart < TWELVE_HOURS_MS;
    });
  }, [shifts, now]);

  if (query.isLoading) {
    return <Skeleton className="h-full min-h-35 w-full rounded-xl" />;
  }

  if (!relevantShift) {
    return (
      <div className="h-full min-h-40 bg-muted rounded-xl flex flex-col items-center justify-center gap-2 p-6 text-center">
        <Clock className="size-7 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">No upcoming shifts today</p>
      </div>
    );
  }

  return <CountdownCard shift={relevantShift} />;
}
