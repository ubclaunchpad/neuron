"use client";

import {
  PageLayout,
  PageLayoutAside,
  PageLayoutContent,
  PageLayoutHeader,
  PageLayoutHeaderContent,
  PageLayoutHeaderTitle,
  usePageAside,
} from "@/components/page-layout";
import { Button } from "@/components/primitives/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { CalendarRange, List } from "lucide-react";
import { Suspense, useCallback, useState } from "react";
import { clientApi } from "@/trpc/client";
import { ScheduleCalendarView } from "./schedule-view";
import { CalendarAside } from "./useCalendarAside";
import { ScheduleListView } from "./useListView";

function SchedulePageContent() {
  const [currentView, setCurrentView] = useState<"list" | "calendar">("list");
  const [selectedShiftId, setSelectedShiftId] = useState<string | undefined>();
  const { setOpen } = usePageAside();

  const { data: selectedShift } = clientApi.shift.byId.useQuery(
    { shiftId: selectedShiftId ?? "00000000-0000-0000-0000-000000000000" },
    { enabled: Boolean(selectedShiftId) },
  );

  const handleSelectShift = useCallback(
    (shiftId: string) => {
      setSelectedShiftId(shiftId);
      setOpen(true);
    },
    [setOpen],
  );

  return (
    <>
      <PageLayoutHeader>
        <PageLayoutHeaderContent className="items-center">
          <div className="flex w-full flex-nowrap items-center justify-between gap-4">
            <PageLayoutHeaderTitle>Schedule</PageLayoutHeaderTitle>
            <ButtonGroup className="ml-auto">
              <Button
                size="sm"
                variant={currentView === "list" ? "default" : "outline"}
                onClick={() => setCurrentView("list")}
                aria-pressed={currentView === "list"}
              >
                <List className="h-4 w-4" />
                <span>List</span>
              </Button>
              <Button
                size="sm"
                variant={currentView === "calendar" ? "default" : "outline"}
                onClick={() => setCurrentView("calendar")}
                aria-pressed={currentView === "calendar"}
              >
                <CalendarRange className="h-4 w-4" />
                <span>Calendar</span>
              </Button>
            </ButtonGroup>
          </div>
        </PageLayoutHeaderContent>
      </PageLayoutHeader>

      <PageLayoutAside>
        <Suspense fallback={<div>Loading shift details...</div>}>
          <CalendarAside shift={selectedShift} />
        </Suspense>
      </PageLayoutAside>

      <PageLayoutContent>
        {currentView === "calendar" ? (
          <ScheduleCalendarView onSelectShift={handleSelectShift} />
        ) : (
          <ScheduleListView onSelectShiftAction={handleSelectShift} />
        )}
      </PageLayoutContent>
    </>
  );
}

export default function SchedulePageClient() {
  return (
    <PageLayout>
      <SchedulePageContent />
    </PageLayout>
  );
}
