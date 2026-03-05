"use client";

import { useEffect, useMemo } from "react";

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
  AsideTitle,
} from "@/components/aside";
import { useClassesPage } from "@/components/classes/list/class-list-view";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { WithPermission } from "@/components/utils/with-permission";
import {
  formatCompressedDateList,
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
import { UserList } from "@/components/users/user-list";

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

  // Close aside if no shiftId is selected
  useEffect(() => {
    if (!selectedClassId) {
      closeAside();
    }
  }, [selectedClassId, closeAside]);

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
    return <></>;
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
                      <UserList
                        users={instructors}
                        emptyLabel="No instructors assigned"
                      />
                    </AsideFieldContent>
                  </AsideField>

                  <WithPermission
                    permissions={{ permission: { classes: ["update"] } }}
                  >
                    <AsideField inline>
                      <AsideFieldLabel>Volunteers</AsideFieldLabel>
                      <AsideFieldContent>
                        <UserList
                          users={volunteers}
                          emptyLabel="No volunteers assigned"
                        />
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
          <WithPermission permissions={{ permission: { classes: ["prefer"] } }}>
            <StarClassButton classId={classData.id} />
          </WithPermission>
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
            tooltip={
              classData.published ? "Class already published" : undefined
            }
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
