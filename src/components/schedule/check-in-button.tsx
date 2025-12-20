"use client";

import { Button } from "@/components/primitives/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AttendanceStatus } from "@/models/interfaces";
import type {
  ListShiftWithPersonalStatus,
  ShiftAttendanceSummary
} from "@/models/shift";
import { clientApi } from "@/trpc/client";
import { cva } from "class-variance-authority";
import { addMinutes, subMinutes } from "date-fns";
import { Clock4Icon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

const statusBadgeStyles = cva("z-10", {
  variants: {
    status: {
      present: "border-emerald-200 bg-emerald-50 text-emerald-700",
      late: "border-amber-200 bg-amber-50 text-amber-800",
      excused: "border-blue-200 bg-blue-50 text-blue-700",
      absent: "border-destructive bg-destructive/10 text-destructive",
    },
  },
});

function formatTimeUntil(target: Date, now: Date) {
  const totalMinutes = Math.max(
    Math.ceil((target.getTime() - now.getTime()) / 60_000),
    0,
  );
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export function CheckInButton({
  shift,
  className,
}: {
  shift: ListShiftWithPersonalStatus;
  className?: string;
}) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const checkInOpensAt = useMemo(() => subMinutes(shift.startAt, 15), [shift.startAt]);
  const checkInClosesAt = useMemo(() => addMinutes(shift.startAt, 30), [shift.startAt]);

  const attendance =
    shift.attendance &&
    !Array.isArray(shift.attendance) &&
    typeof shift.attendance === "object" &&
    "status" in shift.attendance
      ? (shift.attendance as ShiftAttendanceSummary)
      : undefined;

  const apiUtils = clientApi.useUtils();
  const { mutate: checkIn, isPending } = clientApi.shift.checkIn.useMutation({
    onSuccess: (_, variables) => {
      void apiUtils.shift.list.invalidate();
      void apiUtils.shift.byId.invalidate({ shiftId: variables.shiftId });
    },
  });

  if (shift.canceled) return null;

  const msUntilStart = shift.startAt.getTime() - now.getTime();
  const isBeforeWindow = now < checkInOpensAt;
  const isWithinWindow = now >= checkInOpensAt && now <= checkInClosesAt;
  const isAfterWindow = now > checkInClosesAt;

  if (attendance) {
    switch (attendance.status) {
      case AttendanceStatus.present:
        return (
          <Badge
            className={cn(statusBadgeStyles({ status: "present" }), className)}
          >
            Checked in
          </Badge>
        );
      case AttendanceStatus.late:
        return (
          <Badge
            className={cn(statusBadgeStyles({ status: "late" }), className)}
          >
            Checked in late
          </Badge>
        );
      case AttendanceStatus.excused:
        return (
          <Badge
            className={cn(statusBadgeStyles({ status: "excused" }), className)}
          >
            Checked in (excused)
          </Badge>
        );
      case AttendanceStatus.absent:
        return (
          <Badge
            className={cn(statusBadgeStyles({ status: "absent" }), className)}
          >
            Absent
          </Badge>
        );
      default:
        break;
    }
  }

  if (msUntilStart > TWELVE_HOURS_MS) {
    return null;
  }

  if (isAfterWindow) {
    return (
      <Badge className={cn(statusBadgeStyles({ status: "absent" }), className)}>
        Absent
      </Badge>
    );
  }

  if (isBeforeWindow) {
    return (
      <div
        className={cn(
          "z-10 flex items-center gap-2 text-xs text-muted-foreground",
          className,
        )}
      >
        <Clock4Icon className="h-4 w-4" aria-hidden />
        <span>Check in: {formatTimeUntil(checkInOpensAt, now)}</span>
      </div>
    );
  }

  if (isWithinWindow) {
    return (
      <Button
        variant="outline"
        size="sm"
        className={cn("z-10 border-primary", className)}
        pending={isPending}
        startIcon={<Clock4Icon className="h-4 w-4" aria-hidden />}
        onClick={() => checkIn({ shiftId: shift.id })}
      >
        Check In
      </Button>
    );
  }

  return null;
}
