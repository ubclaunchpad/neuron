"use client";

import { useMemo } from "react";

import { useClassesPage } from "@/components/classes/context";
import { Button } from "@/components/primitives/button";
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
  SidebarSectionContent,
  SidebarSectionHeader,
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
      occurrence: describeScheduleOccurrence(s),
      instructors: (s.instructors ?? []).map((i) => ({
        id: i.id,
        fullName: `${i.name} ${i.lastName}`,
      })),
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

      <Separator />

      <SidebarBody>
        <SidebarSection>
          <SidebarSectionContent>
            <SidebarField inline={false}>
              <SidebarFieldLabel>Description</SidebarFieldLabel>
              <SidebarFieldContent>
                {!!classData?.description || "No description"}
              </SidebarFieldContent>
            </SidebarField>
          </SidebarSectionContent>
        </SidebarSection>

        <Separator />

        {scheduleViews.map(
          ({ id, time, dates, occurrence, instructors, volunteers }) => (
            <SidebarSection key={id}>
              <SidebarSectionHeader className="items-baseline">
                <SidebarTitle>{occurrence}</SidebarTitle>
                <span className="text-muted-foreground">{time}</span>
                <span className="text-muted-foreground">{dates}</span>
              </SidebarSectionHeader>

              <SidebarSectionContent>
                <SidebarField inline>
                  <SidebarFieldLabel>Instructor</SidebarFieldLabel>
                  <SidebarFieldContent>
                    {instructors.length === 0 ? (
                      <span>—</span>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {instructors.map((v) => (
                          <span key={v.id}>{v.fullName}</span>
                        ))}
                      </div>
                    )}
                  </SidebarFieldContent>
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
              </SidebarSectionContent>
            </SidebarSection>
          )
        )}
      </SidebarBody>

      <Separator />

      <SidebarFooter>
        <div className="flex gap-4">
          <WithPermission permissions={{ permission: { classes: ["create"] } }}>
            <Button>
              <ClassIcon />
              Publish Class
            </Button>
          </WithPermission>
          <WithPermission permissions={{ permission: { classes: ["delete"] } }}>
            <Button variant="destructive">Delete Class</Button>
          </WithPermission>
        </div>
      </SidebarFooter>
    </SidebarContainer>
  );
}
