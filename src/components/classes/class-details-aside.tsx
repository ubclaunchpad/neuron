"use client";

import { useMemo } from "react";

import {
  AsideBody,
  AsideContainer,
  AsideDescription,
  AsideField,
  AsideFieldContent,
  AsideFieldLabel,
  AsideHeader,
  AsideSection,
  AsideSectionContent,
  AsideSectionHeader,
  AsideSectionTitle,
  AsideTitle,
} from "@/components/aside";
import { useClassesPage } from "@/components/classes/classes-view";
import { Button } from "@/components/primitives/button";
import { Separator } from "@/components/primitives/separator";
import { WithPermission } from "@/components/utils/with-permission";
import { formatScheduleRecurrence, formatTimeRange } from "@/lib/schedule-fmt";
import { clientApi } from "@/trpc/client";
import { Trash } from "lucide-react";
import React from "react";
import { TypographyRegBold } from "../primitives/typography";

export function ClassDetailsAside() {
  const { selectedClassId } = useClassesPage();

  const { data: classData } = clientApi.class.byId.useQuery(
    { classId: selectedClassId ?? "" },
    { enabled: !!selectedClassId, suspense: !!selectedClassId },
  );

  const scheduleViews = useMemo(() => {
    return (classData?.schedules ?? []).map((s) => ({
      id: s.id,
      time: formatTimeRange(s.localStartTime, s.localEndTime),
      recurrence: formatScheduleRecurrence(s.rule),
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
    <AsideContainer>
      <AsideHeader className="border-0 pb-0">
        <AsideTitle>{classData?.name}</AsideTitle>
        <AsideDescription>
          {classData?.category} {classData?.subcategory}
        </AsideDescription>
      </AsideHeader>

      <div className="flex gap-2">
        <WithPermission permissions={{ permission: { classes: ["create"] } }}>
          <Button variant="outline" size="sm">
            <span>Edit</span>
          </Button>
        </WithPermission>
        <WithPermission permissions={{ permission: { classes: ["create"] } }}>
          <Button size="sm">
            <span>Publish</span>
          </Button>
        </WithPermission>
        <WithPermission permissions={{ permission: { classes: ["delete"] } }}>
          <Button size="icon-sm" variant="destructive-outline">
            <Trash />
          </Button>
        </WithPermission>
      </div>

      <AsideBody>
        <AsideSection>
          <AsideSectionHeader>
            <AsideSectionTitle>General</AsideSectionTitle>
          </AsideSectionHeader>
          <AsideSectionContent>
            <AsideField inline={false}>
              <AsideFieldLabel>Description</AsideFieldLabel>
              <AsideFieldContent>
                {!!classData?.description || "No description"}
              </AsideFieldContent>
            </AsideField>
          </AsideSectionContent>
        </AsideSection>

        <AsideSection>
          <AsideSectionHeader className="items-baseline">
            <AsideSectionTitle>Schedules</AsideSectionTitle>
          </AsideSectionHeader>

          {scheduleViews.map(
            ({ id, time, recurrence, instructors, volunteers }, index) => (
              <React.Fragment key={id}>
                {index > 0 && <Separator />}

                <div className="space-y-2">
                  <div className="flex align-center gap-2 h-5">
                    <TypographyRegBold>{recurrence}</TypographyRegBold> 
                    <Separator orientation="vertical" />
                    <span className="text-sm text-muted-foreground">{time}</span>
                  </div>

                  <AsideField inline>
                    <AsideFieldLabel>Instructors</AsideFieldLabel>
                    <AsideFieldContent>
                      {instructors.length === 0 ? (
                        <span>No Instructors</span>
                      ) : (
                        <div className="flex flex-col gap-1">
                          {instructors.map((v) => (
                            <span key={v.id}>{v.fullName}</span>
                          ))}
                        </div>
                      )}
                    </AsideFieldContent>
                  </AsideField>

                  <AsideField inline>
                    <AsideFieldLabel>Volunteers</AsideFieldLabel>
                    <AsideFieldContent>
                      {volunteers.length === 0 ? (
                        <span>No Volunteers</span>
                      ) : (
                        <div className="flex flex-col gap-1">
                          {volunteers.map((v) => (
                            <span key={v.id}>{v.fullName}</span>
                          ))}
                        </div>
                      )}
                    </AsideFieldContent>
                  </AsideField>
                </div>
              </React.Fragment>
            ),
          )}
        </AsideSection>
      </AsideBody>
    </AsideContainer>
  );
}
