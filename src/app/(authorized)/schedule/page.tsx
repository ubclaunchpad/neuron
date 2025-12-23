"use client";

import { FullCalendarNavbar, FullCalendarProvider } from "@/components/fullcalendar";
import {
  PageLayout,
  PageLayoutAside,
  PageLayoutContent,
  PageLayoutHeader,
  PageLayoutHeaderContent,
  PageLayoutHeaderTitle,
} from "@/components/page-layout";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { parseAsStringEnum, useQueryState } from "nuqs";
import { Activity, Suspense } from "react";
import { ScheduleMonthSelect } from "../../../components/schedule/schedule-month-select";
import { SchedulePageProvider } from "../../../components/schedule/schedule-page-context";
import { ShiftDetailsAside } from "../../../components/schedule/shift-details-aside";
import { ScheduleCalendarView } from "./schedule-calendar-view";
import { ScheduleListView } from "./schedule-list-view";

type ScheduleView = "list" | "week";

export default function SchedulePage() {
  const [currentView, setCurrentView] = useQueryState(
    "view",
    parseAsStringEnum<ScheduleView>(["list", "week"])
      .withDefault("list")
      .withOptions({ clearOnDefault: false }),
  );

  return (
    <PageLayout>
      <SchedulePageProvider>
        <FullCalendarProvider>
          <PageLayoutHeader hideShadow border="always">
            <PageLayoutHeaderContent className="items-center">
              <PageLayoutHeaderTitle>Schedule</PageLayoutHeaderTitle>
              <ToggleGroup
                type="single"
                className="self-justify-end"
                value={currentView}
                onValueChange={(value) =>
                  value && setCurrentView(value as ScheduleView)
                }
                variant="outline"
              >
                <ToggleGroupItem value="list" aria-label="List view">
                  List View
                </ToggleGroupItem>
                <ToggleGroupItem value="week" aria-label="Week view">
                  Week View
                </ToggleGroupItem>
              </ToggleGroup>
            </PageLayoutHeaderContent>
            <div className="flex px-9 w-full items-center gap-2">
              {currentView === "list" && <ScheduleMonthSelect />}
            </div>
            {currentView === "week" && <FullCalendarNavbar className="border-t"/>}
          </PageLayoutHeader>

          <PageLayoutAside>
            <Suspense fallback={<>Loading shift...</>}>
              <ShiftDetailsAside />
            </Suspense>
          </PageLayoutAside>

          <PageLayoutContent>
            <div
              className={cn(currentView === "week" ? "block" : "hidden")}
              aria-hidden={currentView !== "week"}
            >
              <ScheduleCalendarView />
            </div>

            <Activity mode={currentView === "list" ? "visible" : "hidden"}>
              <ScheduleListView />
            </Activity>
          </PageLayoutContent>
        </FullCalendarProvider>
      </SchedulePageProvider>
    </PageLayout>
  );
}
