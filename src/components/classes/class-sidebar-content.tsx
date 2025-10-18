"use client";

import { useMemo } from "react";

import { useClassesPage } from "@/components/classes/context";
import { Button } from "@/components/primitives/button";
import { ButtonGroup } from "@/components/primitives/button-group";
import { Separator } from "@/components/primitives/separator";
import {
  SidebarBody,
  SidebarContainer,
  SidebarField,
  SidebarFieldContent,
  SidebarFieldLabel,
  SidebarFooter,
  SidebarHeader,
  SidebarSection,
  SidebarTitle,
} from "@/components/sidebar";
import { WithPermission } from "@/components/utils/with-permission";
import { clientApi } from "@/trpc/client";
import {
  describeScheduleDates,
  describeScheduleOccurrence,
  describeScheduleTime,
} from "@/utils/scheduleUtils";
import ClassIcon from "@public/assets/icons/nav/classes.svg";

export function ClassSidebarContent() {
  const { selectedClassId } = useClassesPage();

  const { data: classData } = clientApi.class.byId.useQuery(
    { classId: selectedClassId ?? "" },
    { enabled: !!selectedClassId, suspense: !!selectedClassId }
  );

  const scheduleViews = useMemo(() => {
    return (classData?.schedules ?? []).map((s) => ({
      id: s.id,
      time: describeScheduleTime(s),
      dates: describeScheduleDates(s),
      occurance: describeScheduleOccurrence(s),
      instructorFullName: s.instructor ? `${s.instructor.name} ${s.instructor.lastName}` : "—",
      volunteers: (s.volunteers ?? []).map((v) => ({
        id: v.id,
        fullName: `${v.name} ${v.lastName}`,
      })),
    }));
  }, [classData?.schedules]);

  return (
    <SidebarContainer>
      {/* Header without border; Separator used below */}
      <SidebarHeader className="border-0 pb-0">
        <div className="min-w-0">
          <SidebarTitle>{classData?.name}</SidebarTitle>
        </div>
      </SidebarHeader>

      <Separator className="my-6" />

      <SidebarBody>
        <SidebarSection>
          <SidebarField inline={false}>
            <SidebarFieldLabel>Description</SidebarFieldLabel>
            <SidebarFieldContent>
              {classData?.description ?? "No description"}
            </SidebarFieldContent>
          </SidebarField>
        </SidebarSection>

        {scheduleViews.map(
          ({ id, time, dates, occurance, instructorFullName, volunteers }) => (
            <SidebarSection key={id}>
              {/* Full-width summary row */}
              <SidebarField inline>
                <SidebarFieldContent full>
                  <div className="flex flex-wrap items-baseline gap-2">
                    <h3 className="text-base font-semibold">{occurance}</h3>
                    <span>{time}</span>
                    <span>{dates}</span>
                  </div>
                </SidebarFieldContent>
              </SidebarField>

              <SidebarField inline>
                <SidebarFieldLabel>Instructor</SidebarFieldLabel>
                <SidebarFieldContent>{instructorFullName}</SidebarFieldContent>
              </SidebarField>

              <SidebarField inline>
                <SidebarFieldLabel>Volunteers</SidebarFieldLabel>
                <SidebarFieldContent>
                  {volunteers.length === 0 ? (
                    <span>—</span>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {volunteers.map((v) => (
                        <span key={v.id}>{v.fullName}</span>
                      ))}
                    </div>
                  )}
                </SidebarFieldContent>
              </SidebarField>
            </SidebarSection>
          )
        )}
      </SidebarBody>

      <SidebarFooter>
        <ButtonGroup>
          <WithPermission permissions={{ permission: { classes: ["create"] } }}>
            <Button>
              <ClassIcon />
              Publish Class
            </Button>
          </WithPermission>
          <WithPermission permissions={{ permission: { classes: ["delete"] } }}>
            <Button>Delete Class</Button>
          </WithPermission>
        </ButtonGroup>
      </SidebarFooter>
    </SidebarContainer>
  );
}
