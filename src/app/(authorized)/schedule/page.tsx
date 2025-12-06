"use client";

import {
  PageLayout,
  PageLayoutAside,
  PageLayoutContent,
  PageLayoutHeader,
  PageLayoutHeaderContent,
  PageLayoutHeaderTitle,
} from "@/components/page-layout";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { parseAsStringEnum, useQueryState } from "nuqs";
import { Suspense } from "react";
import { ScheduleMonthSelect } from "./schedule-month-select";
import { SchedulePageProvider } from "./schedule-page-context";
import { ScheduleCalendarView } from "./schedule-calendar-view";
import { ShiftDetailsAside } from "./shift-details-aside";
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
        <PageLayoutHeader>
          <PageLayoutHeaderContent className="items-center">
            <PageLayoutHeaderTitle>Schedule</PageLayoutHeaderTitle>
            <ToggleGroup
              type="single"
              className="self-justify-end"
              value={currentView}
              onValueChange={(value) => setCurrentView(value as ScheduleView)}
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
        </PageLayoutHeader>

        <PageLayoutAside>
          <Suspense fallback={<>Loading shift...</>}>
            <ShiftDetailsAside />
          </Suspense>
        </PageLayoutAside>

        <PageLayoutContent>
          {currentView === "week" ? (
            <ScheduleCalendarView />
          ) : (
            <ScheduleListView />
          )}
        </PageLayoutContent>
      </SchedulePageProvider>
    </PageLayout>
  );
}
