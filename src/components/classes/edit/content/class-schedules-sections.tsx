import { Button } from "@/components/primitives/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
import {
  formatScheduleRecurrence,
  formatTimeRange,
  joinWithSeparators,
} from "@/lib/schedule-fmt";
import NiceModal from "@ebay/nice-modal-react";
import { Calendar, Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback } from "react";
import { useFieldArray } from "react-hook-form";
import { ScheduleFormDialog } from "../schedule-form/schedule-form-dialog";
import type {
  ScheduleEditSchemaInput,
  ScheduleEditSchemaOutput,
} from "../schedule-form/schema";
import { useClassForm } from "../class-form-provider";
import { buildEmptySchedule, scheduleRuleToFormValues } from "../utils";
import { tryCatch } from "@/lib/try-catch";

export function ClassSchedulesSection() {
  const {
    form: { control, getValues },
  } = useClassForm();

  const {
    fields: schedules,
    append: addSchedule,
    insert: insertSchedule,
    update: replaceSchedule,
    remove: removeSchedule,
  } = useFieldArray({
    control,
    name: "schedules",
    keyName: "key",
  });

  const handleAddSchedule = useCallback(async () => {
    const { data: newScheduleData, hasError } = await tryCatch(
      NiceModal.show(ScheduleFormDialog, {
        initial: buildEmptySchedule(),
        isEditing: false,
      }),
    );
    if (hasError) return;
    const {
      rule: { nth, interval, ...restRule },
      ...rest
    } = newScheduleData as any;
    addSchedule({
      ...rest,
      rule: {
        ...restRule,
        nth: nth?.toString(),
        interval: interval?.toString(),
      },
    });
  }, [addSchedule]);

  const handleEditSchedule = useCallback(
    async (index: number, schedule: ScheduleEditSchemaOutput) => {
      const { data: updatedScheduleData, hasError } = await tryCatch(
        NiceModal.show(ScheduleFormDialog, {
          initial: {
            ...schedule,
            rule: scheduleRuleToFormValues(schedule.rule),
          },
          isEditing: true,
        }),
      );
      if (hasError) return;
      const {
        rule: { nth, interval, ...restRule },
        ...rest
      } = updatedScheduleData as any;
      replaceSchedule(index, {
        ...rest,
        rule: {
          ...restRule,
          nth: nth?.toString(),
          interval: interval?.toString(),
        },
      });
    },
    [replaceSchedule],
  );

  const handleDuplicateSchedule = useCallback(
    (index: number) => {
      const schedule = getValues(
        `schedules.${index}`,
      ) as ScheduleEditSchemaInput;

      // Drop the id so this is treated as a new schedule
      const { id, ...rest } = schedule;
      insertSchedule(index, rest as ScheduleEditSchemaInput);
    },
    [insertSchedule, getValues],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Schedules</CardTitle>
        <CardDescription>
          Set up the recurring or one-time sessions for this class.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {schedules.length === 0 ? (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Calendar />
              </EmptyMedia>
              <EmptyTitle>No Schedules Yet</EmptyTitle>
              <EmptyDescription>
                You haven&apos;t created any schedules yet. Click the button
                below to add your first schedule.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                type="button"
                onClick={() => handleAddSchedule()}
                size="sm"
              >
                <Plus />
                Create a schedule
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <>
            <ItemGroup className="border divide-y &[*]:border-0 rounded-md">
              {schedules.map((field, index) => {
                const schedule = getValues(
                  `schedules.${index}`,
                ) as ScheduleEditSchemaOutput;

                return (
                  <Item
                    key={field.key}
                    variant="noBorder"
                    className="rounded-none"
                  >
                    <ItemContent className="gap-1">
                      <ItemTitle>
                        {formatScheduleRecurrence(schedule.rule)} from{" "}
                        {formatTimeRange(
                          schedule.localStartTime,
                          schedule.localEndTime,
                          {
                            rangeSeparator: " to ",
                          },
                        )}
                      </ItemTitle>
                      <ItemDescription>
                        Taught by:{" "}
                        {joinWithSeparators(
                          schedule.instructors.map((i) => i.label),
                          { sep: ", " },
                          "No instructors chosen",
                        )}
                      </ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      <ButtonGroup>
                        <Button
                          variant="outline"
                          onClick={() => removeSchedule(index)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 />
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleEditSchedule(index, schedule)}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleDuplicateSchedule(index)}
                        >
                          <Copy />
                        </Button>
                      </ButtonGroup>
                    </ItemActions>
                  </Item>
                );
              })}
            </ItemGroup>

            <Button
              type="button"
              onClick={() => handleAddSchedule()}
              variant="ghost"
              size="sm"
              className="mt-6"
            >
              <Plus />
              Add a schedule
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
