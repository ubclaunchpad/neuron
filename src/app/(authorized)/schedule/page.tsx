"use client";

import type { EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import "./page.scss";

const calendarViews = {
  timeGridWeek: {
    slotLabelFormat: {
      hour: "numeric",
      hour12: true,
    } as const,
    slotMinTime: '9:00AM',
    allDaySlot: false,
  },
};

export default function SchedulePage() {
  const handleEventClick = (info: EventClickArg) => {
    alert(`Clicked on event: ${info.event.title}`);
  };

  const renderDayHeader = (arg: { date: Date }) => {
    const dayName = arg.date.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = arg.date.getDate();

    const today = new Date();
    const isToday =
      arg.date.getFullYear() === today.getFullYear() &&
      arg.date.getMonth() === today.getMonth() &&
      arg.date.getDate() === today.getDate();

    return (
      <div style={{ 
                    textAlign: 'center', 
                    color: isToday ? '#4385AC' : 'black',
                    fontWeight : isToday ? 'bold' : 'normal',
                  }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{dayNum}</div>
        <div style={{ fontSize: '0.85rem' }}>{dayName}</div>
      </div>
    );
  };

  return (
    <FullCalendar
      plugins={[ dayGridPlugin, timeGridPlugin ]}
      initialView="timeGridWeek"
      firstDay={1}
      headerToolbar={{
        left: 'today prev,next',
        center: '',
        right: 'dayGridMonth,timeGridWeek'
      }}
      dayHeaderContent={renderDayHeader}
      views={calendarViews}
      events={[
        {
          title: 'Dummy Event',
          start: '2025-10-19T13:00:00',
          end: '2025-10-19T15:00:00',
        }
      ]}
      eventClick={handleEventClick}
    />
  )
}
