import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getMonday,
  isSameDay,
} from "../../app/(authorized)/schedule/dateUtils";
import { useFullCalendarContext } from "./fullcalendar-context";

export function DayViewHeader() {
  const { calendarApi } = useFullCalendarContext();

  if (!calendarApi) return null;

  const selectedDate = calendarApi.getDate();
  const weekStart = getMonday(selectedDate);
  return (
    <div className="sticky flex w-full justify-between">
      {Array.from({ length: 7 }, (_, i) => {
        const curDate = new Date(weekStart);
        curDate.setDate(weekStart.getDate() + i);

        const isToday = isSameDay(curDate, selectedDate);
        return (
          <Button
            key={i}
            variant="ghost"
            onClick={() => queueMicrotask(() => calendarApi.gotoDate(curDate))}
            className={cn(
              "flex-1 block transition-none h-[unset]! rounded-none p-2! pt-3! text-center border-border",
              isToday && "border-b-2 border-primary",
            )}
          >
            <div
              className={cn(
                "font-normal font-display text-lg",
                isToday && "font-bold text-primary",
              )}
            >
              {curDate.getDate()}
            </div>
            <div
              className={cn("font-normal", isToday && "font-bold text-primary")}
            >
              {curDate.toLocaleDateString("en-US", { weekday: "short" })}
            </div>
          </Button>
        );
      })}
    </div>
  );
}
