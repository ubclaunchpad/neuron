"use client";

import { FullCalendar } from "@/components/fullcalendar";
import { useFullCalendarContext } from "@/components/fullcalendar/fullcalendar-context";
import { useShiftRange } from "@/components/schedule/hooks/use-shift-range";
import { useSchedulePage } from "@/components/schedule/schedule-page-context";
import { type EventClickArg } from "@fullcalendar/core";
import { useEffect, useState } from "react";

export function ScheduleCalendarView() {
  const { calendarApi } = useFullCalendarContext();
  const { selectedDate, setSelectedDate, openAsideFor } = useSchedulePage();
  const [dateRange, setDateRange] = useState({
    start: new Date(),
    end: new Date(),
  });

  // Render calendar in appropriate view
  useEffect(() => {
    if (!calendarApi) return;

    if (calendarApi.getDate().toISOString() !== selectedDate.toISOString()) {
      queueMicrotask(() => {
        calendarApi.gotoDate(selectedDate);
      });
    }
  }, [selectedDate]);

  const { shifts: scheduleShifts } = useShiftRange(dateRange);

  const handleEventClick = (info: EventClickArg) => {
    openAsideFor(info.event.id);
    setSelectedDate(info.event.start!);
  };

  return (
    <FullCalendar
      eventClick={handleEventClick}
      events={scheduleShifts.map((shift) => ({
        id: shift.id,
        title: shift.className,
        start: shift.startAt,
        end: shift.endAt,
      }))}
      datesSet={({ start, end }) => {
        setDateRange({ start, end });
        setSelectedDate(start);
      }}
    />
  );
}
