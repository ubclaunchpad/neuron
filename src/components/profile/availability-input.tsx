"use client";

import { cn } from "@/lib/utils";
import React, { useEffect, useRef, useState } from "react";
import { mergeProps, useMove } from "react-aria";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DAYS_PER_WEEK, SLOTS_PER_DAY } from "@/constants";
import {
  getSlotIndex,
  isSlotAvailable,
  isValidAvailabilityBitstring,
} from "@/utils/availabilityUtils";
import EditIcon from "@public/assets/icons/edit.svg";
import { TypographyTitle } from "../ui/typography";

export type AvailabilityGridProps = {
  availability: string;
  editable?: boolean;
  onSave?: (newAvailability: string) => void;
  onCancel?: () => void;
  isEditing?: boolean;
  title?: string;
  className?: string;
};

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

function generateTimeLabels(): string[] {
  const labels: string[] = [];
  for (let hour = 9; hour <= 18; hour++) {
    const time12 = hour > 12 ? hour - 12 : hour;
    const period = hour >= 12 ? "PM" : "AM";
    labels.push(`${time12} ${period}`);
    labels.push(""); // half-hour spacer
  }
  return labels;
}
const TIME_LABELS = generateTimeLabels();

type Slot = { day: number; time: number };

export function AvailabilityInput({
  availability,
  editable = true,
  onSave,
  onCancel,
  title = "My Availability",
  className,
}: AvailabilityGridProps) {
  if (!isValidAvailabilityBitstring(availability)) {
    throw new Error("Invalid availability bitstring");
  }

  const [editMode, setEditMode] = useState(false);
  const [localAvailability, setLocalAvailability] = useState<string[]>(
    availability.split(""),
  );
  useEffect(() => {
    setLocalAvailability(availability.split(""));
  }, [availability]);

  // Drag state
  const [anchor, setAnchor] = useState<Slot | null>(null);
  const [end, setEnd] = useState<Slot | null>(null);
  const [applyValue, setApplyValue] = useState<boolean | null>(null);
  const [dragging, setDragging] = useState(false);
  const daysAreaRef = useRef<HTMLDivElement>(null);
  const movedRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const isBetween = (num: number, a: number, b: number) =>
    num >= Math.min(a, b) && num <= Math.max(a, b);

  const checkPreviewed = (day: number, time: number) =>
    end &&
    anchor &&
    isBetween(day, end.day, anchor.day) &&
    isBetween(time, end.time, anchor.time);

  const clampToGrid = (el: HTMLElement, pt: { x: number; y: number }) => {
    const r = el.getBoundingClientRect();
    const x = Math.min(Math.max(pt.x - r.left, 0), r.width - 1);
    const y = Math.min(Math.max(pt.y - r.top, 0), r.height - 1);
    return { x, y, rect: r };
  };

  const pointToSlot = (clientX: number, clientY: number): Slot => {
    const { x, y, rect } = clampToGrid(daysAreaRef.current!, {
      x: clientX,
      y: clientY,
    });
    const colW = rect.width / DAYS_PER_WEEK;
    const rowH = rect.height / SLOTS_PER_DAY;
    return {
      day: Math.min(DAYS_PER_WEEK - 1, Math.max(0, Math.floor(x / colW))),
      time: Math.min(SLOTS_PER_DAY - 1, Math.max(0, Math.floor(y / rowH))),
    };
  };

  const applyRectToBitstring = (
    bitstring: string[],
    a: Slot,
    b: Slot,
    value: boolean,
  ): string[] => {
    const next = [...bitstring];
    const r1 = Math.min(a.time, b.time),
      r2 = Math.max(a.time, b.time);
    const c1 = Math.min(a.day, b.day),
      c2 = Math.max(a.day, b.day);
    for (let d = c1; d <= c2; d++) {
      for (let t = r1; t <= r2; t++) {
        next[getSlotIndex(d, t)] = value ? "1" : "0";
      }
    }
    return next;
  };

  const commitRect = React.useCallback(() => {
    if (applyValue !== null && anchor && end) {
      setLocalAvailability((prev) =>
        applyRectToBitstring(prev, anchor, end, applyValue),
      );
    }
  }, [anchor, end, applyValue]);

  const resetDrag = React.useCallback(() => {
    setDragging(false);
    setAnchor(null);
    setEnd(null);
    setApplyValue(null);
    lastPointRef.current = null;
    movedRef.current = false;
  }, []);

  const { moveProps } = useMove({
    onMove(e) {
      if (!editMode || !dragging || !daysAreaRef.current || !anchor) return;
      movedRef.current = true;
      const start = lastPointRef.current!;
      const current = { x: start.x + e.deltaX, y: start.y + e.deltaY };
      lastPointRef.current = current;
      setEnd(pointToSlot(current.x, current.y));
    },
    onMoveEnd() {
      if (!editMode || !movedRef.current) return;
      commitRect();
      resetDrag();
    },
  });

  const handleInitialPointerDown = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!editMode || !daysAreaRef.current) return;
      if (e.button !== 0) return; // left button only
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      e.preventDefault();

      movedRef.current = false;
      lastPointRef.current = { x: e.clientX, y: e.clientY };
      const start = pointToSlot(e.clientX, e.clientY);
      setAnchor(start);

      const anchorCurrent = isSlotAvailable(
        localAvailability,
        start.day,
        start.time,
      );
      setApplyValue(!anchorCurrent);
      setEnd(start);
      setDragging(true);
    },
    [pointToSlot, editMode, localAvailability],
  );

  const overlayProps = mergeProps(moveProps, {
    onPointerDown: handleInitialPointerDown,
    onPointerUp: () => {
      if (editMode && dragging && !movedRef.current) {
        commitRect();
        resetDrag();
      }
    },
    onPointerCancel: resetDrag,
  });

  const handleSave = React.useCallback(() => {
    onSave?.(localAvailability.join(""));
    setEditMode(false);
  }, [localAvailability, onSave]);

  const handleCancel = React.useCallback(() => {
    setLocalAvailability(availability.split(""));
    setEditMode(false);
    onCancel?.();
  }, [availability, onCancel]);

  return (
    <Card
      className={cn(
        "flex flex-col gap-5 overflow-hidden",
        "[--border:#E0E0E0]",
        "[--border-secondary:#F7F7F7]",
        "[--success-light:color-mix(in_oklab,var(--color-success)_15%,transparent)]",
        "[--destructive-light:color-mix(in_oklab,var(--color-destructive)_15%,transparent)]",
        className,
      )}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <TypographyTitle>{title}</TypographyTitle>

          {editable && (
            <div className="flex items-center gap-2">
              {!editMode ? (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setEditMode(true)}
                  aria-label="Edit availability"
                >
                  <EditIcon className="size-4 text-muted-foreground" />
                </Button>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave}>
                    Save
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Relative wrapper so the drag overlay can be positioned */}
        <div className="relative w-full z-0">
          <Table
            className={cn(
              // Use fixed layout and remove default spacing for precise cell hit-testing
              "table-fixed border-separate border-spacing-0 w-full",
              "select-none cursor-default",
            )}
          >
            <TableHeader
              className={cn(
                // Head cell styles
                "[&>tr>th]:h-7 [&>tr>th]:p-2 [&>tr>th]:pt-1",
                "[&>tr>th]:border-b [&>tr>th]:border-border",
                // Vertical separators after the day column headers (skip time col and day label col)
                "[&>tr>th:nth-child(n+3)]:border-l",
                // No borders on the first two head cells (time + first day)
                "[&>tr>th:first-child]:border-0 [&>tr>th:nth-child(2)]:border-l-0",
                // Zebra header background
                "[&>tr>th]:bg-background [&>tr>th:nth-child(2n)]:bg-muted/40",
                "text-foreground align-top",
              )}
            >
              <TableRow>
                {/* time column header (empty, just a spacer) */}
                <TableHead className="w-14 p-0 border-0" />
                {DAYS.map((d, i) => (
                  <TableHead
                    key={i}
                    className="text-accent-foreground text-left"
                  >
                    {d}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {Array.from({ length: SLOTS_PER_DAY }, (_, time) => (
                <TableRow
                  key={time}
                  className={cn(
                    // Row cell sizing
                    "[&>td]:h-6 [&>td]:p-0",
                    // Borders: bottom on each cell, light zebra for odd rows, no bottom on last row
                    "[&>td]:border-b odd:[&>td]:border-b-(--border-secondary) last:[&>td]:border-b-0",
                    // Vertical separators between day cells (skip time label col and the first day cell)
                    "[&>td:nth-child(n+3)]:border-l [&>td]:border-border [&>td:first-child]:border-0",
                    // Establish base per-cell background CSS var (zebra for even columns)
                    "[--cell-base:hsl(var(--background))]",
                    // Remove hover styles
                    "hover:bg-(--cell-base)!",
                    "[&>td:nth-child(2n)]:[--cell-base:rgba(217,217,217,0.15)]",
                  )}
                >
                  {/* Time label column */}
                  <TableCell className="align-middle pr-2 text-sm text-muted-foreground">
                    {TIME_LABELS[time]}
                  </TableCell>

                  {/* Day cells */}
                  {DAYS.map((_, day) => {
                    const isPreviewed = dragging && checkPreviewed(day, time);
                    const isAvailable = isSlotAvailable(
                      localAvailability,
                      day,
                      time,
                    );
                    const isPreviewedAvailable = isPreviewed
                      ? !!applyValue
                      : isAvailable;

                    const state:
                      | "unavailable"
                      | "available"
                      | "preview-available"
                      | "preview-unavailable" = isPreviewed
                      ? isPreviewedAvailable
                        ? "preview-available"
                        : "preview-unavailable"
                      : isAvailable
                        ? "available"
                        : "unavailable";

                    return (
                      <TableCell
                        key={`${day}-${time}`}
                        data-state={state}
                        data-editable={editMode}
                        className={cn(
                          "transition-colors bg-(--cell-bg)",
                          "[--cell-bg:var(--cell-base)]",
                          "data-[state=available]:[--cell-bg:var(--color-success)]",
                          "data-[state=preview-available]:[--cell-bg:var(--success-light)]",
                          "data-[state=preview-unavailable]:[--cell-bg:var(--destructive-light)]",
                          "data-[editable=true]:cursor-pointer select-none",
                        )}
                      />
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Drag overlay */}
          {editMode && (
            <div
              ref={daysAreaRef}
              className="absolute left-14 right-0 top-8 bottom-0 touch-none"
              {...mergeProps(overlayProps)}
              aria-hidden="true"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
