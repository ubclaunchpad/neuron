"use client";

import clsx from "clsx";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { mergeProps, useMove } from "react-aria";
import {
    Cell,
    Column,
    ResizableTableContainer,
    Row,
    Table,
    TableBody,
    TableHeader,
} from "react-aria-components";

import { Button } from "@/components/primitives/button";
import { Card } from "@/components/primitives/Card";
import { DAYS_PER_WEEK, SLOTS_PER_DAY } from "@/constants";
import {
    getSlotIndex,
    isSlotAvailable,
    isValidAvailabilityBitstring,
} from "@/utils/availabilityUtils";
import EditIcon from "@public/assets/icons/edit.svg";
import "./index.scss";

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

// Simple hour labels every 30 mins from 9:00; only show text on the hour.
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

export function AvailabilityGrid({
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

  const isBetween = (num: number, first: number, second: number) => {
    const min = Math.min(first, second);
    const max = Math.max(first, second);
    return num >= min && num <= max;
  };

  const checkPreviewed = (day: number, time: number) =>
    end != null &&
    anchor != null &&
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
    const day = Math.min(DAYS_PER_WEEK - 1, Math.max(0, Math.floor(x / colW)));
    const time = Math.min(SLOTS_PER_DAY - 1, Math.max(0, Math.floor(y / rowH)));
    return { day, time };
  };

  const applyRectToBitstring = (
    bitstring: string[],
    a: { day: number; time: number },
    b: { day: number; time: number },
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

  const commitRect = useCallback(() => {
    if (applyValue !== null && anchor && end) {
      setLocalAvailability((prev) =>
        applyRectToBitstring(prev, anchor, end, applyValue),
      );
    }
  }, [anchor, end, applyValue]);

  const resetDrag = useCallback(() => {
    setDragging(false);
    setAnchor(null);
    setEnd(null);
    setApplyValue(null);
    lastPointRef.current = null;
    movedRef.current = false;
  }, []);

  // react-aria drag movement
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
      // Only handle when a drag actually happened.
      if (!editMode || !movedRef.current) return;
      commitRect();
      resetDrag();
    },
  });

  // Initial pointer down before useMove kicks in
  const handleInitialPointerDown = useCallback(
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
    [editMode, localAvailability],
  );

  const overlayProps = mergeProps(moveProps, {
    onPointerDown: handleInitialPointerDown,
    onPointerUp: () => {
      // Click without movement
      if (editMode && dragging && !movedRef.current) {
        commitRect();
        resetDrag();
      }
    },
    onPointerCancel: resetDrag,
  });

  // Actions
  const handleSave = useCallback(() => {
    onSave?.(localAvailability.join(""));
    setEditMode(false);
  }, [localAvailability, onSave]);

  const handleCancel = useCallback(() => {
    setLocalAvailability(availability.split(""));
    setEditMode(false);
    onCancel?.();
  }, [availability, onCancel]);

  return (
    <Card className={clsx("availability-grid", className)}>
      <div className="availability-grid__header">
        <h2 className="availability-grid__title">{title}</h2>
        {editable && (
          <div className="availability-grid__actions">
            {!editMode ? (
              <React.Fragment key="view">
                <Button
                  className="ghost small icon-only"
                  onClick={() => setEditMode(true)}
                >
                  <EditIcon />
                </Button>
              </React.Fragment>
            ) : (
              <React.Fragment key="edit">
                <Button className="secondary small" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button className="small" onClick={handleSave}>
                  Save
                </Button>
              </React.Fragment>
            )}
          </div>
        )}
      </div>

      <ResizableTableContainer
        className="availability-grid__container"
        aria-label="Availability editor"
      >
        <Table className="availability-grid__table" selectionMode="none">
          <TableHeader>
            <Column
              isRowHeader
              width={30}
              key="time"
              className="availability-grid__time-header"
            />
            {DAYS.map((d, i) => (
              <Column
                isRowHeader
                key={i}
                className="availability-grid__day-header"
              >
                {d}
              </Column>
            ))}
          </TableHeader>
          <TableBody>
            {Array.from({ length: SLOTS_PER_DAY }, (_, time) => (
              <Row key={time} className="availability-grid__row">
                <Cell className="availability-grid__time-label">
                  {TIME_LABELS[time]}
                </Cell>
                {DAYS.map((_, day) => {
                  const isPreviewed = dragging && checkPreviewed(day, time);
                  const isAvailable = isSlotAvailable(
                    localAvailability,
                    day,
                    time,
                  );
                  const isPreviewedAvailable = isPreviewed
                    ? applyValue
                    : isAvailable;
                  return (
                    <Cell
                      key={`${day}-${time}`}
                      className={clsx(
                        "availability-grid__slot",
                        editMode && "editable",
                        isAvailable && "available",
                        isPreviewedAvailable && "preview-available",
                        isPreviewed && "preview",
                      )}
                    />
                  );
                })}
              </Row>
            ))}
          </TableBody>
        </Table>

        {/* Transparent overlay capturing drag (covers only the day cells, not time column / headers) */}
        {editMode && (
          <div
            ref={daysAreaRef}
            className="availability-grid__overlay"
            {...overlayProps}
            aria-hidden="true"
          />
        )}
      </ResizableTableContainer>
    </Card>
  );
}
