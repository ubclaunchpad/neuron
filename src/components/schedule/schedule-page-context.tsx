"use client";

import { clientApi } from "@/trpc/client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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

export const SchedulePageContext = createContext<SchedulePageContextValue | null>(
  null,
);

export function useSchedulePage() {
  const ctx = useContext(SchedulePageContext);
  if (!ctx) {
    throw new Error("useSchedulePage must be used within SchedulePageProvider");
  }
  return ctx;
}

type SchedulePageProviderProps = PropsWithChildren<{
  shiftId: string | null;
  setShiftId: (id: string | null) => Promise<URLSearchParams>;
}>;

export function SchedulePageProvider({
  shiftId,
  setShiftId,
  children,
}: SchedulePageProviderProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // When a shiftId is present (e.g. from URL), fetch the shift and navigate
  // to its date so the list/calendar shows the correct month.
  const { data: shiftData } = clientApi.shift.byId.useQuery(
    { shiftId: shiftId ?? "" },
    { enabled: !!shiftId },
  );

  useEffect(() => {
    if (shiftData?.startAt) {
      const shiftDate =
        shiftData.startAt instanceof Date
          ? shiftData.startAt
          : new Date(shiftData.startAt);
      setSelectedDate((prev) =>
        prev.toISOString() === shiftDate.toISOString() ? prev : shiftDate,
      );
    }
  }, [shiftData?.startAt]);

  const openAsideFor = useCallback(
    (id: string) => {
      setShiftId(id);
    },
    [setShiftId],
  );

  const closeAside = useCallback(() => {
    setShiftId(null);
  }, [setShiftId]);

  const value = useMemo(
    () => ({
      selectedShiftId: shiftId,
      selectedDate,
      setSelectedDate,
      openAsideFor,
      closeAside,
    }),
    [shiftId, selectedDate, setSelectedDate, openAsideFor, closeAside],
  );

  return (
    <SchedulePageContext.Provider value={value}>
      {children}
    </SchedulePageContext.Provider>
  );
}
