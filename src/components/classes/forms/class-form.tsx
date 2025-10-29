"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import z from "zod";

import { CLASS_CATEGORIES } from "@/components/classes/classes-grid-view";
import { FormInput } from "@/components/form/FormInput";
import { FormSelect } from "@/components/form/FormSelect";
import { FormTextarea } from "@/components/form/FormTextarea";
import { Button } from "@/components/primitives/button";
import { ButtonGroup } from "@/components/primitives/button-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/primitives/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/primitives/empty";
import { FieldGroup } from "@/components/primitives/field";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/primitives/item";
import { SelectItem } from "@/components/primitives/select";
import type { Weekday } from "@/models/api/schedule";
import { WEEKDAY_TO_TITLE } from "@/utils/scheduleUtils";
import NiceModal from "@ebay/nice-modal-react";
import { Calendar, Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback } from "react";
import { ScheduleEditSchema, ScheduleFormDialog, type ScheduleEditSchemaInput, type ScheduleEditSchemaOutput } from "./schedule-form";

export const ClassEditSchema = z.object({
  name: z.string().nonempty("Please fill out this field."),
  description: z.string().optional(),
  meetingURL: z.url("Please enter a valid meeting url.").optional(),
  category: z.string().min(1, "Please fill out this field."),
  schedules: z.array(ScheduleEditSchema),
});
export type ClassEditSchemaType = z.infer<typeof ClassEditSchema>;

function getScheduleSummary(schedule: ScheduleEditSchemaOutput) {
  const { localStartTime, localEndTime, rule, tzid } = schedule;

  let frequencyText = "";
  if (rule.type === "weekly") {
    const weekday = rule.weekday ? WEEKDAY_TO_TITLE[rule.weekday] : "Not set";
    const interval = rule.interval || 1;
    frequencyText =
      interval === 1
        ? `Weekly on ${weekday}`
        : `Every ${interval} weeks on ${weekday}`;
  } else if (rule.type === "monthly") {
    const weekday = rule.weekday ? WEEKDAY_TO_TITLE[rule.weekday] : "Not set";
    const nthText = ["First", "Second", "Third", "Fourth", "Fifth"][
      (rule.nth || 1) - 1
    ];
    frequencyText = `Monthly on ${nthText} ${weekday}`;
  } else if (rule.type === "single") {
    const dateCount = rule.extraDates?.length || 0;
    frequencyText = `${dateCount} specific date${dateCount !== 1 ? "s" : ""}`;
  }

  const timeText =
    localStartTime && localEndTime
      ? `${localStartTime} - ${localEndTime}`
      : "Time not set";

  return { frequencyText, timeText, tzid };
}

const buildEmptySchedule = (): ScheduleEditSchemaInput => ({
  localStartTime: "",
  localEndTime: "",
  /* Default to user's current tz */
  tzid: Intl.DateTimeFormat().resolvedOptions().timeZone,
  volunteerUserIds: [],
  instructorUserIds: [],
  rule: {
    type: "weekly",
    weekday: "" as Weekday,
    interval: "",
    nth: "",
    extraDates: [],
  } as any,
});

export function ClassForm({
  initial,
  onSubmit,
}: {
  initial: ClassEditSchemaType;
  onSubmit: (data: ClassEditSchemaType) => void;
  isSubmitting: boolean;
}) {
  const { control, handleSubmit, getValues } = useForm({
    resolver: zodResolver(ClassEditSchema),
    defaultValues: initial,
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const {
    fields: schedules,
    append: addSchedule,
    update: replaceSchedule,
    remove: removeSchedule,
  } = useFieldArray({
    control,
    name: "schedules",
    keyName: "key",
  });

  const handleAddSchedule = useCallback(async () => {
    const newScheduleData = await NiceModal.show(ScheduleFormDialog, {
      initial: buildEmptySchedule(),
      isEditing: false,
    });
    addSchedule(newScheduleData as ScheduleEditSchemaInput);
  }, [addSchedule]);

  const handleEditSchedule = useCallback(
    async (index: number, schedule: ScheduleEditSchemaOutput) => {
      const updatedScheduleData = await NiceModal.show(ScheduleFormDialog, {
        initial: schedule,
        isEditing: true,
      });
      replaceSchedule(index, updatedScheduleData as ScheduleEditSchemaOutput);
    },
    [replaceSchedule],
  );

  return (
    <>
      <form
        id="class-form"
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-8 p-9 pt-0"
      >
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Class Info</CardTitle>
            <CardDescription>Basic details about the class.</CardDescription>
          </CardHeader>

          <CardContent>
            <FieldGroup>
              <FormInput
                control={control}
                name="name"
                label="Title"
                placeholder="Enter Title"
                required
              />

              <FormInput
                control={control}
                name="meetingURL"
                label="Meeting Link"
                placeholder="https://zoom.us/j/..."
                description="Optional video conferencing link for online classes"
              />

              <FormSelect
                control={control}
                name="category"
                label="Category"
                placeholder="Select Category"
                required
              >
                {CLASS_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </FormSelect>

              <FormTextarea
                control={control}
                name="description"
                label="Description"
                placeholder="Enter Description"
                description="Optional. Add context for instructors and volunteers."
              />
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Schedules</CardTitle>
            <CardDescription>
              Add one or more schedules for this class
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
                    const schedule = getValues(`schedules.${index}`) as ScheduleEditSchemaOutput;
                    const { frequencyText, timeText } = getScheduleSummary(schedule);

                    return (
                      <Item key={field.key} variant="noBorder" className="rounded-none">
                        <ItemContent className="gap-1">
                          <ItemTitle>
                            {frequencyText} from {timeText}
                          </ItemTitle>
                          <ItemDescription>
                            Taught by: Test user
                          </ItemDescription>
                        </ItemContent>
                        <ItemActions>
                          <ButtonGroup>
                            <Button
                              variant="outline"
                              onClick={() => removeSchedule(index)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() =>
                                handleEditSchedule(index, schedule)
                              }
                            >
                              <Pencil className="h-4 w-4" />
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
      </form>
    </>
  );
}
