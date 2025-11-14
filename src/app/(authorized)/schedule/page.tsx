"use client";

import type { DayHeaderContentArg, EventClickArg } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import "./page.scss";

// Below this width in px our calendar will switch to a day view
const DAYVIEW_TRIGGER = 600;

export default function SchedulePage() {
  // State
  const calendarRef = useRef<FullCalendar | null>(null);
  const [isDayView, setIsDayView]       = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Day view effects
  useEffect(() => {
    const checkWidth = () => setIsDayView(window.innerWidth < DAYVIEW_TRIGGER);
    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  // Re-render our calendar view in resize or date change
  useEffect(() => {
    const calendarApi = calendarRef.current?.getApi();
    if (!calendarApi) return;

    queueMicrotask(() => {
      if (isDayView) calendarApi.changeView("timeGridDay", selectedDate);
      else           calendarApi.changeView("timeGridWeek", selectedDate);
    });
  }, [isDayView, selectedDate]);

  const handleEventClick = (info: EventClickArg) => {
    alert(`Clicked on event: ${info.event.title}`);
  };

  // Only triggered in day view
  const handleDayClick = (date: Date) => {
    const calendarApi = calendarRef.current?.getApi();
    if (!calendarApi) return;

    setSelectedDate(date);
    calendarApi.changeView("timeGridDay", date);
  };

  const renderDayViewHeader = () => {
    // Begin on MONDAY of the current week
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - ((startOfWeek.getDay() + 6) % 7));

    // Array of clickable date buttons for the header
    const days = Array.from({ length: 7 }, (_, i) => {
      const curDate = new Date(startOfWeek);
      curDate.setDate(startOfWeek.getDate() + i);
      const dayName = curDate.toLocaleDateString("en-US", { weekday: "short" });
      const dayNum  = curDate.getDate();

      const isSelected = curDate.getFullYear() === selectedDate.getFullYear() &&
                         curDate.getMonth() === selectedDate.getMonth() &&
                         curDate.getDate() === selectedDate.getDate();

      return (
        <div 
          key={i}
          onClick={() => handleDayClick(curDate)}
          className={`
            fc-col-header-cell 
            dayview-header-date 
            ${isSelected ? "dayview-header-date-selected" : ""}
          `}
        >
          <div style={{ fontSize: "24px" }}>{dayNum}</div>
          <div style={{ fontSize: "14px" }}>{dayName}</div>
        </div>
      );
    });

    return (
      <div className="dayview-header">
        {days}
      </div>
    );
  };

  const renderDayHeader = (arg: DayHeaderContentArg) => {
    const date: Date = arg.date;
    const dayName: string = date.toLocaleDateString("en-US", { weekday: "long" });
    const dayNum: number = date.getDate();

    const today = new Date();
    const isToday = 
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    return (
      <div className={`test ${isToday ? "test-current-day" : ""}`}>
        <div style={{ fontSize: "24px" }}>{dayNum}</div>
        <div style={{ fontSize: "14px" }}>{dayName}</div>
      </div>
    )
  };

  return (
    <div style={{ padding: "1rem" }}>
      <p style={{ fontWeight: 700, fontSize: "28px", paddingBottom: "1rem" }}>Schedule</p>

      {isDayView && renderDayViewHeader()}

      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin]}
        initialView="timeGridWeek"
        headerToolbar={false}
        dayHeaderContent={(arg) => {
          if (isDayView) return;
          return renderDayHeader(arg);
        }}
        height="auto"
        slotMinTime="09:00:00"
        allDaySlot={false}
        eventClick={handleEventClick}
        firstDay={1}
        events={[
          {
            title: "Dummy Event",
            start: "2025-10-19T13:00:00",
            end: "2025-10-19T15:00:00",
          },
          {
            title: "Another Event",
            start: "2025-10-20T10:00:00",
            end: "2025-10-20T11:30:00",
          },
        ]}
      />
    </div>
  );
}
