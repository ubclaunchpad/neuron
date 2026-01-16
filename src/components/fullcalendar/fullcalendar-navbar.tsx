import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useFullCalendarContext } from "./fullcalendar-context";

export function FullCalendarControls() {
  const { calendarApi } = useFullCalendarContext();
  return (
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
  );
}
