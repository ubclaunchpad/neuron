import {
  diffArray,
  diffEntityArray,
  getFormValues,
  type DirtyFields,
} from "@/utils/formUtils";
import { useCallback } from "react";
import type { ScheduleEditSchemaOutput } from "../schedule-form/schema";
import { useClassForm } from "../class-form-provider";
import type { ClassEditSchemaOutput, ClassFormValues } from "../schema";

export function useClassFormSubmit({
  onSubmit,
}: {
  onSubmit: (data: Record<string, unknown>) => void;
}) {
  const { form, initial, isEditing } = useClassForm();
  const {
    formState: { dirtyFields },
  } = form;

  const getUpdatedScheduleValues = useCallback(
    (
      values: ScheduleEditSchemaOutput,
      dirtyFields: DirtyFields<ScheduleEditSchemaOutput> | undefined,
      original: ScheduleEditSchemaOutput,
    ) => {
      const { id, volunteers, instructors, ...rest } = values;

      const { added: addedVolunteerUserIds, deleted: removedVolunteerUserIds } =
        diffArray(
          original.volunteers.map((v) => v.id),
          volunteers.map((v) => v.id),
        );
      const {
        added: addedInstructorUserIds,
        deleted: removedInstructorUserIds,
      } = diffArray(
        original.instructors.map((i) => i.id),
        instructors.map((i) => i.id),
      );

      return {
        id,
        addedVolunteerUserIds,
        removedVolunteerUserIds,
        addedInstructorUserIds,
        removedInstructorUserIds,
        ...getFormValues(rest, dirtyFields, isEditing),
      };
    },
    [],
  );

  const getUpdatedFormValues = useCallback(
    (values: ClassEditSchemaOutput): ClassFormValues => {
      const { schedules, levelRange, ...rest } = values;

      const originalSchedules = initial?.schedules ?? [];
      const { added, edited, deletedIds } = diffEntityArray(
        originalSchedules,
        schedules,
        "id" as const,
      );

      const updatedValues: ClassFormValues = {
        ...getFormValues(rest, dirtyFields, isEditing),
        addedSchedules: added.map(({ volunteers, instructors, ...s }) => ({
          volunteerUserIds: volunteers.map((v) => v.id),
          instructorUserIds: instructors.map((i) => i.id),
          ...s,
        })),
        updatedSchedules: edited.map((schedule) => {
          const original = originalSchedules.find((s) => s.id === schedule.id)!;
          const valueIdx = schedules.findIndex((s) => s.id === schedule.id)!;
          return getUpdatedScheduleValues(
            schedule,
            dirtyFields.schedules?.[valueIdx],
            original,
          );
        }) as any,
        deletedSchedules: deletedIds,
      };

      if (
        !isEditing ||
        initial.levelRange[0] !== levelRange[0] ||
        initial.levelRange[1] !== levelRange[1]
      ) {
        updatedValues.lowerLevel = levelRange[0]!;
        updatedValues.upperLevel = levelRange[1]!;
      }

      return updatedValues;
    },
    [initial, isEditing, dirtyFields, getUpdatedScheduleValues],
  );

  const handleFormSubmit = useCallback(
    (values: ClassEditSchemaOutput) => {
      onSubmit(getUpdatedFormValues(values));
    },
    [onSubmit, getUpdatedFormValues],
  );

  return {
    handleFormSubmit,
  };
}
