import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useFullCalendarContext } from "./fullcalendar-context";

export function FullCalendarNavbar({ className }: { className?: string }) {
  const {
    calendarApi,
  } = useFullCalendarContext();

  const selectedDate = calendarApi?.getDate() ?? new Date();
  return (
    <div className={cn("flex w-full items-center justify-between", className)}>
      <div className="flex items-center gap-4">
        <ButtonGroup>
          <Button variant="ghost" onClick={() => calendarApi?.today()}>
            Today
          </Button>
          <Button variant="ghost" onClick={() => calendarApi?.prev()}>
            <ChevronLeft />
          </Button>
          <Button variant="ghost" onClick={() => calendarApi?.next()}>
            <ChevronRight />
          </Button>
        </ButtonGroup>
        <div>
          {selectedDate.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </div>
      </div>
    </div>
  );
}
