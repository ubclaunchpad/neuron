"use client";

import { FullCalendarProvider } from "@/components/fullcalendar";
import {
  PageLayout,
  PageLayoutAside,
  PageLayoutContent,
  PageLayoutHeader,
  PageLayoutHeaderContent,
  PageLayoutHeaderTitle,
} from "@/components/page-layout";
import { SchedulePageControls } from "@/components/schedule/schedule-page-controls";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { parseAsStringEnum, useQueryState } from "nuqs";
import { Activity, Suspense } from "react";
import { SchedulePageProvider } from "../../../components/schedule/schedule-page-context";
import { ShiftDetailsAside } from "../../../components/schedule/shift-details-aside";
import { ScheduleCalendarView } from "./schedule-calendar-view";
import { ScheduleListView } from "./schedule-list-view";
import { skeletonAside } from "@/components/ui/skeleton";

export type ScheduleView = "list" | "week";

export default function SchedulePage() {
  const [currentView, setCurrentView] = useQueryState(
    "view",
    parseAsStringEnum<ScheduleView>(["list", "week"])
      .withDefault("list")
      .withOptions({ clearOnDefault: false }),
  );

  return (
    <PageLayout>
      <FullCalendarProvider>
        <SchedulePageProvider>
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
            <SchedulePageControls currentView={currentView} />
          </PageLayoutHeader>

          <PageLayoutAside>
            <Suspense fallback={skeletonAside()}>
              <ShiftDetailsAside />
            </Suspense>
          </PageLayoutAside>

          <PageLayoutContent className="flex-1">
            {currentView === "week" && (
              <div className={cn("h-[calc(100dvh-var(--page-header-h))]")}>
                <ScheduleCalendarView />
              </div>
            )}

            <Activity mode={currentView === "list" ? "visible" : "hidden"}>
              <ScheduleListView />
            </Activity>
          </PageLayoutContent>
        </SchedulePageProvider>
      </FullCalendarProvider>
    </PageLayout>
  );
}
