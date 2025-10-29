"use client"

import { parseAsString, useQueryState } from "nuqs"

import { ClassForm, type ClassEditSchemaType } from "@/components/classes/forms/class-form"
import type { ScheduleEditSchemaOutput } from "@/components/classes/forms/schedule-form"
import { PageLayout, PageLayoutHeader, PageLayoutHeaderContent, PageLayoutHeaderTitle } from "@/components/page-layout"
import { Button } from "@/components/primitives/button"
import { Loader } from "@/components/utils/loader"
import type { CreateClassInput, UpdateClassInput } from "@/models/api/class"
import type { SingleClass } from "@/models/class"
import { clientApi } from "@/trpc/client"
import { diffArray, diffEntityArray } from "@/utils/formUtils"

function toFormValues(cls?: SingleClass): ClassEditSchemaType {
  return {
    name: cls?.name ?? "",
    description: cls?.description ?? "",
    meetingURL: cls?.meetingURL ?? "",
    category: cls?.category ?? "",
    schedules:
      cls?.schedules.map((s) => ({
        id: s.id,
        localStartTime: s.localStartTime,
        localEndTime: s.localEndTime,
        tzid: s.tzid,
        volunteerUserIds: s.volunteers.map((v) => v.id),
        instructorUserIds: s.instructors.map((i) => i.id),
        rule: {
          type: s.rule.type,
          extraDates: s.rule.type === "single" ? s.rule.extraDates : [],
          weekday: s.rule.type !== "single" ? s.rule.weekday : "MO",
          nth: s.rule.type === "monthly" ? s.rule.nth : 1,
          interval: s.rule.type === "weekly" ? s.rule.interval : 1,
        },
        effectiveStart: s.effectiveStart,
        effectiveEnd: s.effectiveEnd,
      })) ?? [],
  };
}

export default function ClassesEditView() {
  const [queryClassId, setQueryClassId] = useQueryState("class", parseAsString);
  const [queryTermId] = useQueryState("term", parseAsString);
  const apiUtils = clientApi.useUtils();
  const isEditing = !!queryClassId;

  const { data: editingClassData, isPending: isLoadingEditingClass } =
    clientApi.class.byId.useQuery(
      { classId: queryClassId ?? "" },
      { enabled: isEditing },
    );

  const { data: currentTermData, isPending: isLoadingCurrentTerm } =
    clientApi.term.current.useQuery(undefined, {
      enabled: !queryTermId && !isEditing,
    });

  const { mutate: createClass, isPending: isCreatingClass } =
    clientApi.class.create.useMutation({
      onSuccess: (createdId) => {
        setQueryClassId(createdId);
        apiUtils.class.list.invalidate();
      },
    });

  const { mutate: updateClass, isPending: isUpdatingClass } =
    clientApi.class.update.useMutation({
      onSuccess: (_, { id }) => {
        apiUtils.class.byId.invalidate({ classId: id });
        apiUtils.class.list.invalidate();
      },
    });

  const isSubmitting = isCreatingClass || isUpdatingClass;
  const loading = isEditing ? isLoadingEditingClass : isLoadingCurrentTerm;
  const initial = toFormValues(
    isEditing ? (editingClassData as SingleClass | undefined) : undefined,
  );

  const onSubmit = (data: ClassEditSchemaType) => {
    if (isEditing) {
      const { schedules, ...dataToSubmit } = data;
      const originalSchedules = initial?.schedules ?? [];

      const originalIdToSchedule = new Map<string, ScheduleEditSchemaOutput>(
        originalSchedules.map((s) => [s.id as string, s]),
      );

      const { added, edited, deletedIds } = diffEntityArray(
        originalSchedules,
        schedules,
        "id",
      );

      updateClass({
        id: queryClassId!,
        addedSchedules: added as any,
        updatedSchedules: edited.map((schedule) => {
          const { volunteerUserIds, id, ...rest } = schedule;
          const originalIds =
            originalIdToSchedule.get(id!)?.volunteerUserIds ?? [];
          const { added: addedIds, deleted: removedIds } = diffArray(
            originalIds,
            volunteerUserIds,
          );

          return {
            ...rest,
            id: id!,
            addedVolunteerUserIds: addedIds,
            removedVolunteerUserIds: removedIds,
          };
        }) as any,
        deletedSchedules: deletedIds,
        ...dataToSubmit,
      } satisfies UpdateClassInput);
    } else {
      const { schedules, ...dataToSubmit } = data;

      createClass({
        termId: (queryTermId ?? currentTermData?.id)!,
        schedules: schedules as any,
        ...dataToSubmit,
      } satisfies CreateClassInput);
    }
  };

  return (
    <PageLayout>
      <PageLayoutHeader border={false}>
        <PageLayoutHeaderContent showBackButton>
          <PageLayoutHeaderTitle>
            {isEditing ? "Edit Class" : "Create Class"}
          </PageLayoutHeaderTitle>

          <Button
            form="class-form"
            type="submit"
            size="sm"
            className="self-justify-end"
          >
            Save
          </Button>
        </PageLayoutHeaderContent>
      </PageLayoutHeader>

      <Loader isLoading={loading} fallback={"Loading class data"}>
        <ClassForm
          key={isEditing ? queryClassId : "create"}
          initial={initial}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
        />
      </Loader>
    </PageLayout>
  );
}
