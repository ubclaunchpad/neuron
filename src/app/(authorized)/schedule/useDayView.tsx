import React from "react";
import { useState, useEffect } from "react";
import type { CalendarControls } from "./useCalendarApi";
import { getMonday, isSameDay } from "./dateUtils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// Below this width in px our calendar will switch to a day view
const DAYVIEW_TRIGGER = 600;

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
        const width = entry.contentRect.width;
        setIsDayView(width < DAYVIEW_TRIGGER);
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

  // Clicking on header changes day view to display target day
  const handleDayClick = (date: Date) => {
    if (!calendarApi) return;
    setSelectedDate(date);
  };

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
            // <div
            //   key={i}
            //   onClick={() => handleDayClick(curDate)}
            //   className={cn(
            //     "fc-col-header-cell flex-1 cursor-pointer border-b border-gray-300 bg-gray-50 py-2 text-center font-normal transition-all duration-200",
            //     isSelected &&
            //       "border-b-2 border-sky-600 font-bold text-sky-600",
            //   )}
            // >
            <Button
              key={i}
              variant="ghost"
              onClick={() => handleDayClick(curDate)}
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
            // </div>
          );
        })}
      </div>
    );
  };

  return { isDayView, selectedDate, setSelectedDate, renderDayViewHeader };
}
