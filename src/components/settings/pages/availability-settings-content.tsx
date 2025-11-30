import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function AvailabilitySettingsContent() {
  return <>
    <ButtonGroup>
      <Button variant="outline" size="icon-sm">
        <ChevronLeft></ChevronLeft>
      </Button>
      <Button variant="outline" size="icon-sm">
        <ChevronRight/>
      </Button>
    </ButtonGroup>
  </>;
}
