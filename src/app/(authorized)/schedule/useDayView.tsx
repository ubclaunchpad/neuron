import React from "react";
import { useState, useEffect } from "react";
import type { CalendarControls } from "./useCalendarApi";
import { getMonday, isSameDay } from "./dateUtils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// Below this width in px our calendar will switch to a day view
const DAYVIEW_TRIGGER_WIDTH_PX = 600;

export function useDayView({
  calendarApi,
  calendarContainerRef,
  selectedDate,
  setSelectedDate,
}: CalendarControls & {
  calendarContainerRef: React.RefObject<HTMLElement | null>;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
}) {
  const [isDayView, setIsDayView] = useState(false);
  const [weekStart, setWeekStart] = useState(() => getMonday(selectedDate));

  useEffect(() => {
    const el = calendarContainerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // This includes padding
        const width = entry.borderBoxSize[0]?.inlineSize;
        width && setIsDayView(width < DAYVIEW_TRIGGER_WIDTH_PX);
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [calendarContainerRef]);

  // weekStart
  useEffect(() => {
    const endOfWeek: Date = new Date(weekStart);
    endOfWeek.setDate(endOfWeek.getDate() + 6);

    if (selectedDate < weekStart || selectedDate > endOfWeek)
      setWeekStart(getMonday(selectedDate));
  }, [selectedDate, weekStart]);

  const renderDayViewHeader = () => {
    return (
      <div className="sticky mb-[1px] flex w-full justify-between border-b border-gray-300">
        {Array.from({ length: 7 }, (_, i) => {
          const curDate = new Date(weekStart);
          curDate.setDate(weekStart.getDate() + i);

          const dayName = curDate.toLocaleDateString("en-US", {
            weekday: "short",
          });
          const dayNum = curDate.getDate();

          const isToday = isSameDay(curDate, selectedDate);

          return (
            <Button
              key={i}
              variant="ghost"
              // changes day view to display target day
              onClick={() => {
                if (!calendarApi) return;
                setSelectedDate(curDate);
              }}
              className={cn(
                "flex-1 block transition-none !h-[unset] rounded-none !p-2 !pt-3 text-center font-normal",
                isToday && "border-b-2 border-primary",
              )}
            >
              <div
                className={cn(
                  "font-display text-lg",
                  isToday && "font-bold text-primary",
                )}
              >
                {dayNum}
              </div>
              <div className={cn(isToday && "font-bold text-primary")}>
                {dayName}
              </div>
            </Button>
          );
        })}
      </div>
    );
  };

  return {
    isDayView,
    selectedDate,
    setSelectedDate,
    renderDayViewHeader,
  };
}
