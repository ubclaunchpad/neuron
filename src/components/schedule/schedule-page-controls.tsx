"use client";

import type { ScheduleView } from "@/app/(authorized)/schedule/page";
import { FullCalendarControls } from "../fullcalendar";
import { MonthSelect } from "./schedule-month-select";
import { useSchedulePage } from "./schedule-page-context";

export function SchedulePageControls({
  currentView,
}: {
  currentView: ScheduleView;
}) {
  const { selectedDate, setSelectedDate } = useSchedulePage();
  return (
    <div className="flex px-9 w-full items-center border-t [&_*]:!rounded-none">
      {currentView === "week" && <FullCalendarControls />}
      <MonthSelect value={selectedDate} onValueChange={setSelectedDate} />
    </div>
  );
}
