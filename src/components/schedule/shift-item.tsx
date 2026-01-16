"use client";

import { Button } from "@/components/primitives/button";
import { useSchedulePage } from "@/components/schedule/schedule-page-context";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import { TypographyRegBold, TypographySmall } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import type { ListShift } from "@/models/shift";
import { createPrng } from "@/utils/prngUtils";
import { differenceInMinutes, format } from "date-fns";
import { useMemo } from "react";
import { backgroundColors } from "../ui/avatar";
import { WithPermission } from "../utils/with-permission";
import { CheckInButton } from "./check-in-button";

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
      {/* Button that covers the entire card */}
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
          <ItemTitle className="truncate block w-full max-w-full">
            {shift.className}
          </ItemTitle>
          <ItemDescription className="text-xs line-clamp-1">
            {shift.classDescription}
          </ItemDescription>
        </ItemContent>
      </ItemContent>
      <ItemActions className="ml-auto gap-2">
        <WithPermission permissions={{ permission: { shifts: ["check-in"] } }}>
          <CheckInButton shift={shift} />
        </WithPermission>
      </ItemActions>
    </Item>
  );
}
