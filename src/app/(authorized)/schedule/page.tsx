"use client";

import {
  PageLayout,
  PageLayoutHeader,
  PageLayoutHeaderContent,
  PageLayoutHeaderTitle
} from "@/components/page-layout";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/primitives/select";

import { Button } from "@/components/primitives/button";
import { ButtonGroup } from "@/components/primitives/button-group";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import CaretLeftIcon from "@public/assets/icons/caret-left.svg";
import CaretRightIcon from "@public/assets/icons/caret-right.svg";
import { useRef, useState } from "react";
import "./page.scss";
import { useCalendarApi } from "./useCalendarApi";
import { useDayView } from "./useDayView";
import { isSameDay } from "./dateUtils";

export default function SchedulePage() {
  // State
  const calendarRef = useRef<FullCalendar | null>(null);
  const [currentMonthYear, setCurrentMonthYear] = useState(new Date());
  const { calendarApi, next, prev, changeView, getDate, goToDate } = useCalendarApi(calendarRef);
  const { isDayView, selectedDate, setSelectedDate, renderDayViewHeader } = useDayView({ calendarApi, next, prev, changeView, getDate, goToDate });

  const handleEventClick = (info: EventClickArg) => {
    alert(`Clicked on event: ${info.event.title}`);
  };

  // Render calendar in appropriate view
  useEffect(() => {
    if (!calendarApi) return;

    queueMicrotask(() => {
    if (isDayView) calendarApi.changeView("timeGridDay", selectedDate);
    else           calendarApi.changeView("timeGridWeek", selectedDate);
    });
  }, [isDayView, selectedDate]);

  const handleNavAction = (navAction: "today" | "prev" | "next") => {
    const calendarApi = calendarRef.current?.getApi();
    if (!calendarApi) return;

    calendarApi[navAction]();
    setSelectedDate(calendarApi.getDate());
  };

  const renderNavBar = () => {
    return <div className="flex flex-row justify-between items-center w-full">
        <div className="flex flex-row items-center">
          <ButtonGroup>
            <Button variant="ghost" onClick={() => handleNavAction("today")}>Today</Button>
            <Button variant="ghost" onClick={() => handleNavAction("prev")}><CaretLeftIcon/></Button>
            <Button variant="ghost" onClick={() => handleNavAction("next")}><CaretRightIcon/></Button>
          </ButtonGroup>
          {currentMonthYear.toLocaleDateString("en-US", {month: "long", year: "numeric"})}
        </div>
        <div>
          {!isDayView && <Select onValueChange={(v) => queueMicrotask(() => calendarRef.current?.getApi().changeView(v))}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Choose view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dayGridMonth">Month</SelectItem>
              <SelectItem value="timeGridWeek">Week</SelectItem>
            </SelectContent>
          </Select>}
        </div>
      </div>
  };

  const renderWeekHeader = (arg: DayHeaderContentArg) => {
    const date: Date = arg.date;
    const dayName: string = date.toLocaleDateString("en-US", { weekday: "long" });
    const dayNum: number = date.getDate();

    const today = new Date();
    // const isToday = 
    //   date.getDate() === today.getDate() &&
    //   date.getMonth() === today.getMonth() &&
    //   date.getFullYear() === today.getFullYear();

    const isToday = isSameDay(date, new Date());

    return (
      <div className={`week-header ${isToday ? "week-header-current-day" : ""}`}>
        <div style={{ fontSize: "24px" }}>{dayNum}</div>
        <div style={{ fontSize: "14px" }}>{dayName}</div>
      </div>
    )
  };

  return (
    <>
      <PageLayout>
        <PageLayoutHeader>
          <PageLayoutHeaderContent>
              <PageLayoutHeaderTitle>Schedule</PageLayoutHeaderTitle>
          </PageLayoutHeaderContent>
              {renderNavBar()}
        </PageLayoutHeader>

      {isDayView && renderDayViewHeader()}

      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin]}
        initialView="timeGridWeek"
        headerToolbar={false}
        dayHeaderContent={(arg) => {
          if (isDayView) return null;
          if (arg.view.type === "dayGridMonth") return <div>{arg.text}</div>;

          return renderWeekHeader(arg);
        }}
        height="auto"
        slotMinTime="09:00:00"
        allDaySlot={false}
        eventClick={handleEventClick}
        firstDay={1}
        datesSet={() => {
          setCurrentMonthYear(calendarApi?.getDate() ?? new Date());
        }}
        events={[
          {
            title: "Dummy Event",
            start: "2025-11-15T13:00:00",
            end: "2025-11-15T15:00:00",
          },
          {
            title: "Another Event",
            start: "2025-11-15T10:00:00",
            end: "2025-11-15T11:30:00",
          },
        ]}
      />
      </PageLayout>
    </>
  );
}
