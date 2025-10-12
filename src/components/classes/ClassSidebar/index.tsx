"use client";

import { useClassesPage } from "@/app/(authorized)/classes/page";
import { Button, ButtonGroup } from "@/components/primitives/button";
import { SidebarContainer, SidebarField, SidebarSection } from "@/components/sidebar";
import { WithPermission } from "@/components/utils/WithPermission";
import { clientApi } from "@/trpc/client";
import { describeScheduleDates, describeScheduleOccurrence, describeScheduleTime } from "@/utils/scheduleUtils";
import ClassIcon from "@public/assets/icons/nav/classes.svg";
import { useMemo } from "react";

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
      volunteers: (s.volunteers ?? []).map(v => ({ id: v.id, fullName: `${v.name} ${v.lastName}` })),
    }));
  }, [classData?.schedules]);
  

  return (
    <SidebarContainer>
      <SidebarContainer.Header>
        <h3>{classData?.name}</h3>
      </SidebarContainer.Header>
      <SidebarContainer.Body>
        <SidebarSection>
          <SidebarField label="Description" inline={false}>
            {classData?.description ?? "No description"}
          </SidebarField>
        </SidebarSection>
        {scheduleViews.map(({
          id, time, dates, occurance, instructorFullName, volunteers
        }) => {
          return (
            <SidebarSection key={id}>
              <SidebarField>
                <h3>{occurance}</h3> {time} {dates}
              </SidebarField>
              <SidebarField inline label="Instructor">
                {instructorFullName}
              </SidebarField>
              <SidebarField inline label="Volunteers">
                {volunteers.map((volunteer) => (
                  <span key={volunteer.id}>{volunteer.fullName}</span>
                ))}
              </SidebarField>
            </SidebarSection>
          );
        })}
      </SidebarContainer.Body>
      <SidebarContainer.Footer>
        <ButtonGroup>
          <WithPermission permissions={{ permission: { classes: ["create"] }}}> 
            <Button>
              <ClassIcon />
              Publish Class
            </Button>
          </WithPermission>
          <WithPermission permissions={{ permission: { classes: ["delete"] }}}>
            <Button>Delete Class</Button>
          </WithPermission>
        </ButtonGroup>
      </SidebarContainer.Footer>
    </SidebarContainer>
  );
}
