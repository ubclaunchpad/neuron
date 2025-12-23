"use client";

import type { CalendarApi } from "@fullcalendar/core";
import FullCalendarComponent from "@fullcalendar/react";
import {
  createContext,
  useContext,
  useRef,
  useState,
  type Dispatch,
  type RefObject,
  type SetStateAction
} from "react";
import { CalendarView } from "../../app/(authorized)/schedule/dateUtils";

const FullCalendarContext = createContext<{
  calendarRef: RefObject<FullCalendarComponent | null>;
  calendarApi: CalendarApi | undefined;
  activeView: CalendarView;
  setActiveView: Dispatch<SetStateAction<CalendarView>>;
} | null>(null);

export function FullCalendarProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const calendarRef = useRef<FullCalendarComponent | null>(null);
  const calendarApi = calendarRef.current?.getApi();
  const [activeView, setActiveView] = useState(CalendarView.Week);

  return (
    <FullCalendarContext.Provider
      value={{
        calendarRef,
        calendarApi,
        activeView,
        setActiveView,
      }}
    >
      {children}
    </FullCalendarContext.Provider>
  );
}

export function useFullCalendarContext() {
  const context = useContext(FullCalendarContext);
  if (!context)
    throw new Error(
      "useFullCalendarContext must be used within FullCalendarProvider",
    );
  return context;
}