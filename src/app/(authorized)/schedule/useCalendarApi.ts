import type { CalendarApi } from "@fullcalendar/core/index.js";
import type FullCalendar from "@fullcalendar/react";

export type CalendarControls = {
  calendarApi: CalendarApi | undefined;
  next: () => void;
  prev: () => void;
  changeView: (view: string) => void;
  getDate: () => Date | undefined;
  goToDate: (d: Date) => void;
};

export function useCalendarApi(calendarRef: React.RefObject<FullCalendar | null>) {
  const calendarApi = calendarRef.current?.getApi();

  return {
    calendarApi,
    next: () => calendarApi?.next(),
    prev: () => calendarApi?.prev(),
    today: () => calendarApi?.today(),
    getDate: () => calendarApi?.getDate(),
    changeView: (view: string) => calendarApi?.changeView(view),
    goToDate: (date: Date) => calendarApi?.gotoDate(date),
  };
}