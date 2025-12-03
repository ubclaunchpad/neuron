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
import { useClassesPage } from "@/components/classes/list/class-list-view";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { WithPermission } from "@/components/utils/with-permission";
import {
  formatCompressedDateList,
  formatScheduleRecurrence,
  formatTimeRange,
  getFrequencyLabel,
  weekdayLabel,
} from "@/lib/schedule-fmt";
import { clientApi } from "@/trpc/client";
import { EditIcon } from "lucide-react";
import Link from "next/link";
import React from "react";
import { TypographyTitle } from "../../ui/typography";
import { DeleteClassButton } from "../primitives/delete-class-button";
import { PublishClassButton } from "../primitives/publish-class-button";
import { StarClassButton } from "../primitives/star-class-button";
import { Avatar } from "@/components/primitives/avatar";

export function ClassDetailsAside() {
  const { selectedClassId, closeAside } = useClassesPage();

  const { data: classData, isPending: isLoadingClassData } =
    clientApi.class.byId.useQuery(
      { classId: selectedClassId ?? "" },
      {
        enabled: !!selectedClassId,
        suspense: !!selectedClassId,
        meta: { suppressToast: true },
      },
    );

  const scheduleViews = useMemo(() => {
    return (classData?.schedules ?? []).map((s) => ({
      id: s.id,
      time: formatTimeRange(s.localStartTime, s.localEndTime),
      dates:
        s.rule.type === "single"
          ? formatCompressedDateList(s.rule.extraDates)
          : weekdayLabel(s.rule.weekday, "long") + "s",
      frequency: getFrequencyLabel(s.rule),
      instructors: (s.instructors ?? []).map((i) => ({
        fullName: `${i.name} ${i.lastName}`,
        ...i,
      })),
      volunteers: (s.volunteers ?? []).map((v) => ({
        fullName: `${v.name} ${v.lastName}`,
        ...v,
      })),
    }));
  }, [classData?.schedules]);

  if (isLoadingClassData || !classData) {
    return <>Loading class...</>;
  }

  return (
    <AsideContainer>
      <AsideHeader className="border-0">
        <AsideTitle>{classData.name}</AsideTitle>
        <AsideDescription>
          {classData.category}
          {classData.subcategory && " | "}
          {classData.subcategory}
        </AsideDescription>
      </AsideHeader>

      <AsideBody>
        <AsideSection>
          <AsideSectionContent>
            <AsideField inline={false}>
              <AsideFieldLabel>Description</AsideFieldLabel>
              <AsideFieldContent>
                {!classData.description
                  ? "No description"
                  : classData.description}
              </AsideFieldContent>
            </AsideField>
          </AsideSectionContent>
        </AsideSection>

        <Separator />

        <AsideSection>
          {scheduleViews.map(
            (
              { id, time, dates, frequency, instructors, volunteers },
              index,
            ) => (
              <React.Fragment key={id}>
                {index > 0 && <Separator />}

                <AsideSectionContent>
                  <div className="flex items-end gap-3">
                    <TypographyTitle>{dates}</TypographyTitle>
                    <span className="inline truncate text-muted-foreground">
                      {frequency}
                      {!!frequency && " | "}
                      {time}
                    </span>
                  </div>

                  <AsideField inline>
                    <AsideFieldLabel>Instructors</AsideFieldLabel>
                    <AsideFieldContent>
                      {instructors.length === 0 ? (
                        <span>No instructors assigned</span>
                      ) : (
                        instructors.map((user) => (
                          <div className="inline-flex items-end gap-1">
                            <Avatar
                              className="size-8 rounded-[0.25rem]"
                              src={user.image}
                              fallbackText={user.fullName}
                            />
                            <div>
                              <div className="text-sm truncate font-medium leading-none">
                                {user.fullName}
                              </div>
                              <div className="text-xs truncate text-muted-foreground">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </AsideFieldContent>
                  </AsideField>

                  <WithPermission
                    permissions={{ permission: { classes: ["update"] } }}
                  >
                    <AsideField inline>
                      <AsideFieldLabel>Volunteers</AsideFieldLabel>
                      <AsideFieldContent>
                        {volunteers.length === 0 ? (
                          <span>No volunteers assigned</span>
                        ) : (
                          volunteers.map((user) => (
                            <div className="inline-flex items-baseline gap-1">
                              <Avatar
                                className="size-8 rounded-[0.25rem]"
                                src={user.image}
                                fallbackText={user.fullName}
                              />
                              <div>
                                <div className="text-sm truncate font-medium leading-none">
                                  {user.fullName}
                                </div>
                                <div className="text-xs truncate text-muted-foreground">
                                  {user.email}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </AsideFieldContent>
                    </AsideField>
                  </WithPermission>
                </AsideSectionContent>
              </React.Fragment>
            ),
          )}
        </AsideSection>

        <Separator />

        <div className="flex gap-2">
          <StarClassButton classId={classData.id} />
          <WithPermission permissions={{ permission: { classes: ["create"] } }}>
            <Button variant="outline" asChild>
              <Link
                href={{
                  pathname: "/classes/edit",
                  query: { class: classData.id },
                }}
              >
                <EditIcon />
                <span>Edit</span>
              </Link>
            </Button>
          </WithPermission>
          <PublishClassButton
            classId={classData.id}
            disabled={classData.published}
            tooltip="Class already published"
          />
          <DeleteClassButton
            classId={classData.id}
            onSuccess={() => closeAside()}
          />
        </div>
      </AsideBody>
    </AsideContainer>
  );
}
