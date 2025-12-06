"use client";

import { useSchedulePage } from "@/app/(authorized)/schedule/schedule-page-context";
import { Button } from "@/components/primitives/button";
import { Badge } from "@/components/ui/badge";
import { TypographyRegBold, TypographySmall } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import {
  Item,
  ItemActions,
  ItemDescription,
  ItemContent,
  ItemTitle,
} from "@/components/ui/item";
import { differenceInMinutes, format } from "date-fns";
import { Clock, Clock4Icon, MapPin, Plus } from "lucide-react";
import type { RouterOutputs } from "@/trpc/client";
import { WithPermission } from "../utils/with-permission";
import { createPrng } from "@/utils/prngUtils";
import { useMemo } from "react";
import { backgroundColors } from "../ui/avatar";

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

type ListShift = RouterOutputs["shift"]["list"]["shifts"][number];

type DerivedShift = {
  start: Date;
  end: Date;
  status: ShiftStatus;
  title: string;
  description?: string;
  location?: string;
  action?: {
    kind: ShiftActionKind;
    label?: string;
  };
  accent?: ScheduleShift["accent"];
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
    pillClass:
      "bg-destructive/10 text-destructive border border-destructive/50",
  },
};

function getDefaultAction(status: ShiftStatus): {
  kind: ShiftActionKind;
  label: string;
} {
  if (status === "needs_coverage") return { kind: "cover", label: "Cover" };
  if (status === "requesting_coverage")
    return { kind: "label", label: "Requested Coverage" };
  if (status === "checked_in") return { kind: "label", label: "Checked In" };
  return { kind: "check_in", label: "Check In" };
}

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

function formatDuration(start: Date, end: Date) {
  const minutes = differenceInMinutes(end, start);

  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"}`;

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) {
    return `${hours} hour${hours > 1 ? "s" : ""}`;
  }

  return `${hours} hr ${mins} min`;
}

function deriveShift(shift: ListShift): DerivedShift {
  const start = toDate(shift.startAt);
  const end = toDate(shift.endAt);

  const personalAttendance =
    "attendance" in shift && !Array.isArray((shift as any).attendance)
      ? (shift as any).attendance
      : undefined;

  const coverageRequest =
    "coverageRequest" in shift ? (shift as any).coverageRequest : undefined;
  const coverageRequests = Array.isArray((shift as any).coverageRequests)
    ? ((shift as any).coverageRequests as Array<{ status?: string }>)
    : undefined;

  let status: ShiftStatus = "upcoming";

  if (personalAttendance?.checkedInAt) {
    status = "checked_in";
  } else if (coverageRequest?.status === "open") {
    status = "requesting_coverage";
  } else if (coverageRequests?.some((c) => c?.status === "open")) {
    status = "needs_coverage";
  }

  const title =
    ("className" in shift && shift.className) ||
    ("class" in shift && (shift as any).class?.name) ||
    "Shift";

  const description =
    ("classDescription" in shift && shift.classDescription) ||
    ("class" in shift && (shift as any).class?.description) ||
    undefined;

  const accent = ("accent" in shift ? (shift as any).accent : undefined) as
    | ScheduleShift["accent"]
    | undefined;

  const location =
    "location" in shift && (shift as any).location
      ? ((shift as any).location as string)
      : undefined;

  const action =
    ("action" in shift ? (shift as any).action : undefined) ??
    getDefaultAction(status);

  return {
    start,
    end,
    status,
    title,
    description: description ?? undefined,
    location,
    action,
    accent,
  };
}

export function ShiftItem({
  shift,
  className,
}: {
  shift: ListShift;
  className?: string;
}) {
  const { openAsideFor } = useSchedulePage();
  const { startAt, endAt } = shift;

  const color = useMemo(() => {
    const prng = createPrng(shift.className);
    return prng.shuffle(backgroundColors)[0]!;
  }, [shift.className]);

  return (
    <Item
      size="sm"
      className={cn(
        "gap-8 relative shadow-xs has-[button[data-overlay]:hover]:bg-accent",
        className,
      )}
    >
      {/* Button that covers the entire card*/}
      <Button
        data-overlay
        unstyled
        aria-label={`Open ${shift.className}`}
        className="absolute inset-0 z-0 cursor-pointer"
        onClick={() => openAsideFor(shift.id)}
      />

      <ItemContent className="flex-row gap-4">
        <div
          style={{ "--avatar-bg": color } as React.CSSProperties}
          className={cn(
            "w-1.5 self-stretch translate-0 shrink-0 rounded bg-primary",
            "bg-(--avatar-bg)",
          )}
        />
        <ItemContent className="flex-0 min-w-max">
          <TypographyRegBold className="text-sm font-semibold">
            {format(startAt, "hh:mm a")}
          </TypographyRegBold>
          <TypographySmall className="text-muted-foreground">
            {formatDuration(startAt, endAt)}
          </TypographySmall>
        </ItemContent>
        <ItemContent className="!flex-1">
          <ItemTitle className="truncate block w-full">
            {shift.className}
          </ItemTitle>
          <ItemDescription className="text-xs line-clamp-1">
            {shift.classDescription}
          </ItemDescription>
        </ItemContent>
      </ItemContent>
      <ItemActions>
        <WithPermission permissions={{ permission: { shifts: ["check-in"] } }}>
          {/*{false && <Badge>Checked In</Badge>}
          {true && (
            <Button variant="outline" className="z-10 border-primary">
              <Clock4Icon />
              <span>Check In</span>
            </Button>
          )}*/}
        </WithPermission>
        {false && (
          <Button
            variant="outline"
            size="sm"
            className="min-w-20 rounded-md border-muted-foreground/30 text-foreground cursor-pointer z-10"
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <Plus className="size-4" aria-hidden />
            <span>Cover</span>
          </Button>
        )}
      </ItemActions>
    </Item>
  );
}

export { STATUS_META as SHIFT_STATUS_META };
