"use client";

import { useClassesPage } from "@/app/(authorized)/classes/page";
import { Button, ButtonGroup } from "@/components/primitives/Button";
import { SidebarContainer, SidebarField, SidebarSection } from "@/components/sidebar";
import { WithPermission } from "@/components/utils/WithPermission";
import { clientApi } from "@/trpc/client";
import { describeScheduleDates, describeScheduleOccurrence, describeScheduleTime } from "@/utils/scheduleUtils";
import ClassIcon from "@public/assets/icons/nav/classes.svg";
import { useMemo } from "react";

export function ClassSidebarContent() {
  const { selectedClassId } = useClassesPage();

  console.log(selectedClassId);
  const { data: classData } = clientApi.class.byId.useQuery(
    { classId: selectedClassId ?? "" }, 
    { enabled: !!selectedClassId, suspense: !!selectedClassId }
  );

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
        {classData?.schedules.map((schedule) => {
          const scheduleTime = useMemo(() => describeScheduleTime(schedule), [schedule]);
          const scheduleDates = useMemo(() => describeScheduleDates(schedule), [schedule]);
          const scheduleOccurrence = useMemo(() => describeScheduleOccurrence(schedule), [schedule]);

          return (
            <SidebarSection key={schedule.id}>
              <SidebarField>
                <h3>{scheduleOccurrence}</h3> {scheduleTime} {scheduleDates}
              </SidebarField>
              <SidebarField label="Instructor" inline={false}>
                {schedule?.instructor?.name} {schedule?.instructor?.lastName}
              </SidebarField>
              <SidebarField label="Volunteers" inline={false}>
                {schedule?.volunteers.map((volunteer) => (
                  <span key={volunteer.id}>{volunteer.name} {volunteer.lastName}</span>
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
