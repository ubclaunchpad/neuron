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

      const updatedValues = {
        id,
        addedVolunteerUserIds,
        removedVolunteerUserIds,
        addedInstructorUserIds,
        removedInstructorUserIds,
        ...getFormValues(rest, dirtyFields, isEditing),
      };

      // If any part of the rule is dirty, send the whole thing
      if (updatedValues.rule && Object.keys(updatedValues.rule).length > 0) {
        updatedValues.rule = values.rule;
      }

      return updatedValues;
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

      const isExercise = values.category.includes("Exercise");
      const effectiveLevelRange = isExercise ? levelRange : null;
      if (
        !isEditing ||
        initial.levelRange?.[0] !== effectiveLevelRange?.[0] ||
        initial.levelRange?.[1] !== effectiveLevelRange?.[1]
      ) {
        updatedValues.lowerLevel = effectiveLevelRange?.[0] ?? null;
        updatedValues.upperLevel = effectiveLevelRange?.[1] ?? null;
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
