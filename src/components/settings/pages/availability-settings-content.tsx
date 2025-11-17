import { Button } from "@/components/primitives/button";
import { ButtonGroup } from "@/components/primitives/button-group";
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
