"use client";

import { usePageAside } from "@/components/page-layout";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

type SchedulePageContextValue = {
  selectedShiftId: string | null;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  openAsideFor: (shiftId: string) => void;
  closeAside: () => void;
};

const SchedulePageContext = createContext<SchedulePageContextValue | null>(
  null,
);

export function useSchedulePage() {
  const ctx = useContext(SchedulePageContext);
  if (!ctx) {
    throw new Error("useSchedulePage must be used within SchedulePageProvider");
  }

  return ctx;
}

export function SchedulePageProvider({ children }: PropsWithChildren) {
  const { setOpen } = usePageAside();
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const openAsideFor = useCallback(
    (shiftId: string) => {
      setSelectedShiftId(shiftId);
      setOpen(true);
    },
    [setOpen],
  );

  const closeAside = useCallback(() => {
    setSelectedShiftId(null);
    setOpen(false);
  }, [setOpen]);

  const value = useMemo(
    () => ({
      selectedShiftId,
      selectedDate,
      setSelectedDate,
      openAsideFor,
      closeAside,
    }),
    [selectedShiftId, selectedDate, setSelectedDate, openAsideFor, closeAside],
  );

  return (
    <SchedulePageContext.Provider value={value}>
      {children}
    </SchedulePageContext.Provider>
  );
}
