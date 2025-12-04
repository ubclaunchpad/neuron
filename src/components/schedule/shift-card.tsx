"use client";

import { Button } from "@/components/primitives/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TypographyRegBold, TypographySmall } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { differenceInMinutes, format, parseISO } from "date-fns";
import { Clock, MapPin, Plus } from "lucide-react";

export type ShiftStatus =
  | "upcoming"
  | "checked_in"
  | "requesting_coverage"
  | "needs_coverage";

export type ShiftActionKind = "check_in" | "cover" | "label" | "none";

export type ScheduleShift = {
  id: string;
  title: string;
  description?: string;
  location?: string;
  start: string; // ISO string
  end: string; // ISO string
  status: ShiftStatus;
  isMine: boolean;
  action?: {
    kind: ShiftActionKind;
    label?: string;
  };
  accent?: "success" | "amber" | "rose" | "primary";
};

const STATUS_META: Record<
  ShiftStatus,
  { label: string; accentClass: string; pillClass: string }
> = {
  upcoming: {
    label: "Upcoming",
    accentClass: "bg-success",
    pillClass: "bg-success/10 text-success border border-success/30",
  },
  checked_in: {
    label: "Checked In",
    accentClass: "bg-success",
    pillClass: "bg-muted text-foreground/80 border border-input",
  },
  requesting_coverage: {
    label: "Requested Coverage",
    accentClass: "bg-amber-400",
    pillClass: "bg-amber-50 text-amber-700 border border-amber-200",
  },
  needs_coverage: {
    label: "Needs Coverage",
    accentClass: "bg-destructive",
    pillClass: "bg-destructive/10 text-destructive border border-destructive/50",
  },
};

function getDefaultAction(
  status: ShiftStatus,
): { kind: ShiftActionKind; label: string } {
  if (status === "needs_coverage") return { kind: "cover", label: "Cover" };
  if (status === "requesting_coverage")
    return { kind: "label", label: "Requested Coverage" };
  if (status === "checked_in") return { kind: "label", label: "Checked In" };
  return { kind: "check_in", label: "Check In" };
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"}`;

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) {
    return `${hours} hour${hours > 1 ? "s" : ""}`;
  }

  return `${hours} hr ${mins} min`;
}

export function ShiftCard({
  shift,
  variant = "default",
  onAction,
  className,
  onSelect,
}: {
  shift: ScheduleShift;
  variant?: "default" | "compact";
  className?: string;
  onAction?: (shift: ScheduleShift) => void;
  onSelect?: (shift: ScheduleShift) => void;
}) {
  const start = parseISO(shift.start);
  const end = parseISO(shift.end);
  const duration = differenceInMinutes(end, start);

  const statusMeta = STATUS_META[shift.status];
  const action = shift.action ?? getDefaultAction(shift.status);

  const accentClass =
    shift.accent === "amber"
      ? "bg-amber-400"
      : shift.accent === "rose"
        ? "bg-rose-500"
        : shift.accent === "primary"
          ? "bg-primary"
          : statusMeta.accentClass;
  const clickable = Boolean(onSelect);

  return (
    <Card
      size="sm"
      className={cn(
        "relative overflow-hidden transition-shadow",
        "rounded-lg border border-input bg-white",
        "shadow-[0_1px_6px_rgba(0,0,0,0.05)] hover:shadow-[0_2px_10px_rgba(0,0,0,0.07)]",
        variant === "compact" ? "shadow-xs" : "shadow-sm",
        clickable && "cursor-pointer",
        className,
      )}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={() => onSelect?.(shift)}
    >
      <div
        className={cn(
          "absolute left-4 h-3/4 w-1.5",
          "rounded-md",
          accentClass,
        )}
        aria-hidden
      />

      <CardContent
        className={cn(
          "flex gap-2 py-3.5 pr-4 pl-6",
          variant === "compact" && "py-1 pr-3.5 pl-5",
        )}
      >
        <div className="flex w-24 flex-col items-start text-left py-1 pl-5">
          <TypographyRegBold className="text-sm font-semibold tracking-tight">
            {format(start, "hh:mm a")}
          </TypographyRegBold>
          <TypographySmall className="text-muted-foreground leading-tight">
            {formatDuration(duration)}
          </TypographySmall>
        </div>

        <div className="flex flex-1 flex-col gap-1.5">
          <div className="flex items-start gap-r2">
            <div className="flex-1 space-y-1">
              <TypographyRegBold className="leading-tight text-[15px]">
                {shift.title}
              </TypographyRegBold>
              {shift.description && (
                <TypographySmall className="text-muted-foreground/80 text-[13px] leading-snug line-clamp-2">
                  {shift.description}
                </TypographySmall>
              )}
              {shift.location && (
                <div className="inline-flex items-center gap-1 text-muted-foreground">
                  <MapPin className="size-3 opacity-80" aria-hidden />
                  <TypographySmall className="text-muted-foreground">
                    {shift.location}
                  </TypographySmall>
                </div>
              )}
            </div>

            <div className="shrink-0">
              {action.kind === "label" && (
                <Badge
                  className={cn(
                    statusMeta.pillClass,
                    "font-medium px-3 py-1.5 rounded-md",
                    "pointer-events-none",
                  )}
                >
                  {action.label ?? statusMeta.label}
                </Badge>
              )}
              {action.kind === "check_in" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="min-w-24 rounded-md border-muted-foreground/30 text-foreground cursor-pointer"
                  onClick={(event) => {
                    event.stopPropagation();
                    onAction?.(shift);
                  }}
                >
                  <Clock className="size-4" aria-hidden />
                  {action.label ?? "Check In"}
                </Button>
              )}
              {action.kind === "cover" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="min-w-20 rounded-md border-muted-foreground/30 text-foreground cursor-pointer"
                  onClick={(event) => {
                    event.stopPropagation();
                    onAction?.(shift);
                  }}
                >
                  <Plus className="size-4" aria-hidden />
                  {action.label ?? "Cover"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export { STATUS_META as SHIFT_STATUS_META };
