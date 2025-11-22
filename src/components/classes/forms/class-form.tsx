"use client";

import { DevTool } from "@hookform/devtools";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useRef } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import z from "zod";

import { CLASS_CATEGORIES } from "@/components/classes/constants";
import { FormErrors, FormField, FormLabel } from "@/components/form/FormBase";
import { FormInput } from "@/components/form/FormInput";
import { FormSelect } from "@/components/form/FormSelect";
import { FormTextarea } from "@/components/form/FormTextarea";
import { asNullishField } from "@/components/form/utils/zod-form-utils";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/primitives/avatar";
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
  Dropzone,
  DropzoneArea,
  DropzoneDescription,
  DropzoneHeader,
  DropzoneHint,
  DropzoneLabel,
  DropzoneMedia,
} from "@/components/primitives/dropzone";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/primitives/empty";
import {
  FieldContent,
  FieldGroup,
  FieldLabel,
} from "@/components/primitives/field";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/primitives/item";
import { LabelRequiredMarker } from "@/components/primitives/label";
import { SelectItem } from "@/components/primitives/select";
import { Slider } from "@/components/primitives/slider";
import { cropImageToSquare } from "@/lib/crop-image";
import { formatScheduleRecurrence, formatTimeRange } from "@/lib/schedule-fmt";
import { cn } from "@/lib/utils";
import type { UpdateClassInput } from "@/models/api/class";
import type { Weekday } from "@/models/api/schedule";
import { diffArray, diffEntityArray } from "@/utils/formUtils";
import NiceModal from "@ebay/nice-modal-react";
import { Calendar, Copy, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  ScheduleEditSchema,
  ScheduleFormDialog,
  type ScheduleEditSchemaInput,
  type ScheduleEditSchemaOutput,
} from "./schedule-form";

export const ClassEditSchema = z
  .object({
    name: z.string().nonempty("Please fill out this field."),
    description: asNullishField(z.string()),
    meetingURL: asNullishField(z.url("Please enter a valid meeting url.")),
    category: z.string().nonempty("Please fill out this field."),
    subcategory: asNullishField(z.string()),
    levelRange: z.array(z.int().min(1).max(4)).length(2),
    schedules: z.array(ScheduleEditSchema),
    image: z.string().nullable(),
  })
  .refine((val) => val.levelRange[0]! <= val.levelRange[1]!, {
    error: "The upper level must be greater than the lower level",
    path: ["levelRange"],
  });

export type ClassEditSchemaType = z.infer<typeof ClassEditSchema>;

const recurranceFormatOptions = {};

const buildEmptySchedule = (): ScheduleEditSchemaInput => ({
  localStartTime: "",
  localEndTime: "",
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

export type ClassFormValues = Omit<UpdateClassInput, "id">;

export function ClassForm({
  initial,
  onSubmit,
  isEditing,
  isSubmitting,
}: {
  initial: ClassEditSchemaType;
  onSubmit: (data: Record<string, unknown>) => void;
  isEditing: boolean;
  isSubmitting: boolean;
}) {
  const {
    control,
    formState: { dirtyFields },
    handleSubmit,
    getValues,
  } = useForm({
    resolver: zodResolver(ClassEditSchema),
    defaultValues: initial,
    mode: "onSubmit",
    reValidateMode: "onChange",
  });
  const currentClassName = useWatch({ control, name: "name" });
  const imageValue = useWatch({ control, name: "image" });
  const previousImageRef = useRef<string | null>(imageValue ?? null);

  // Clean up previous blob URL whenever the image changes
  useEffect(() => {
    const prev = previousImageRef.current;
    const next = imageValue ?? null;

    if (prev && prev !== next && prev.startsWith("blob:")) {
      URL.revokeObjectURL(prev);
    }

    previousImageRef.current = next;
  }, [imageValue]);

  // Clean up the last blob URL when the component unmounts
  useEffect(() => {
    return () => {
      const last = previousImageRef.current;
      if (last && last.startsWith("blob:")) {
        URL.revokeObjectURL(last);
      }
    };
  }, []);

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

  const handleDuplicateSchedule = useCallback(
    (index: number) => {
      const schedule = getValues(
        `schedules.${index}`,
      ) as ScheduleEditSchemaOutput;
      console.log(schedule);

      // Drop the id so this is treated as a new schedule
      const { id, ...rest } = schedule;
      insertSchedule(index, rest as ScheduleEditSchemaOutput);
    },
    [addSchedule, getValues],
  );

  const getUpdatedFormValues = (
    values: ClassEditSchemaType,
  ): ClassFormValues => {
    const {
      schedules,
      levelRange,
      description,
      meetingURL,
      image,
      subcategory,
      ...rest
    } = values;

    const originalSchedules = initial?.schedules ?? [];
    const { added, edited, deletedIds } = diffEntityArray(
      originalSchedules,
      schedules,
      "id" as const,
    );

    const updatedValues: ClassFormValues = {
      ...rest,
      addedSchedules: added,
      updatedSchedules: edited.map((schedule) => {
        const original = originalSchedules.find((s) => s.id === schedule.id)!;
        return getUpdatedScheduleValues(schedule, original);
      }) as any,
      deletedSchedules: deletedIds,
    };

    if (dirtyFields.image) {
      updatedValues.image = image;
    }

    if (dirtyFields.description) {
      updatedValues.description = description;
    }

    if (dirtyFields.meetingURL) {
      updatedValues.meetingURL = meetingURL;
    }

    if (dirtyFields.subcategory) {
      updatedValues.subcategory = subcategory;
    }

    if (
      !isEditing ||
      initial.levelRange[0] !== levelRange[0] ||
      initial.levelRange[1] !== levelRange[1]
    ) {
      updatedValues.lowerLevel = levelRange[0]!;
      updatedValues.upperLevel = levelRange[1]!;
    }

    return updatedValues;
  };

  const getUpdatedScheduleValues = (
    values: ScheduleEditSchemaOutput,
    original: ScheduleEditSchemaOutput,
  ) => {
    const {
      volunteerUserIds,
      instructorUserIds,
      effectiveStart,
      effectiveEnd,
      ...rest
    } = values;

    const { added: addedVolunteerUserIds, deleted: removedVolunteerUserIds } =
      diffArray(original.volunteerUserIds, volunteerUserIds);
    const { added: addedInstructorUserIds, deleted: removedInstructorUserIds } =
      diffArray(original.instructorUserIds, instructorUserIds);

    return {
      ...rest,
      effectiveStart: effectiveStart ?? null,
      effectiveEnd: effectiveEnd ?? null,
      addedVolunteerUserIds,
      removedVolunteerUserIds,
      addedInstructorUserIds,
      removedInstructorUserIds,
    };
  };

  const handleFormSubmit = (values: ClassEditSchemaType) => {
    onSubmit(getUpdatedFormValues(values));
  };

  return (
    <>
      <DevTool control={control} />
      <form
        id="class-form"
        onSubmit={handleSubmit(handleFormSubmit)}
        className="flex flex-col gap-8 p-9 pt-4"
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

              <FieldGroup className="sm:flex-row">
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

                <FormInput
                  control={control}
                  name="subcategory"
                  label="Subcategory"
                  placeholder="Enter Subcategory"
                />
              </FieldGroup>

              <FormField control={control} name="levelRange">
                {({ onChange, value, ...field }) => (
                  <>
                    <FieldLabel className="flex justify-between items-end">
                      <span>
                        Levels <LabelRequiredMarker />
                      </span>
                      <span className="text-sm">
                        Level {value[0]}{" "}
                        {value[0] !== value[1] && `- ${value[1]}`}
                      </span>
                    </FieldLabel>

                    <Slider
                      min={1}
                      max={4}
                      step={1}
                      value={value}
                      onValueChange={onChange}
                      {...field}
                    />

                    {/* Labels for each level */}
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Level 1</span>
                      <span>Level 2</span>
                      <span>Level 3</span>
                      <span>Level 4</span>
                    </div>

                    <FormErrors />
                  </>
                )}
              </FormField>

              <FormTextarea
                control={control}
                name="description"
                label="Description"
                placeholder="Enter Description"
                description="Add additional context for volunteers."
              />

              <FormInput
                control={control}
                name="meetingURL"
                label="Meeting Link"
                placeholder="https://zoom.us/j/..."
                description="Optional video conferencing link for online classes"
              />

              <FormField
                control={control}
                label="Cover Image"
                description="Choose a cover image for the class which will be shown to volunteers"
                name="image"
              >
                {({ onChange, value }) => (
                  <>
                    <FieldContent>
                      <FormLabel />
                    </FieldContent>

                    <Dropzone
                      accept="image/*"
                      multiple={false}
                      maxSize={4 * 1024 * 1024 /* 4MB */}
                      onFilesChange={async (files) => {
                        const file = files[0]?.file;
                        if (file instanceof File) {
                          // Crop image
                          const { previewUrl } = await cropImageToSquare(file, {
                            size: 512,
                            mimeType: "image/webp",
                            quality: 0.8,
                          });

                          onChange(previewUrl);
                        } else if (!file) {
                          onChange(null);
                        }
                      }}
                      onError={(errors) => {
                        toast.error(errors[0]);
                      }}
                    >
                      <div
                        className={cn(
                          "grid gap-4 [grid-template-columns:min-content_1fr]",
                          "[grid-template-areas:'img_btn''drp_drp']",
                          "sm:[grid-template-areas:'img_drp''btn_drp']",
                        )}
                      >
                        <Avatar className="[grid-area:img] aspect-square size-[140px] shrink-0 rounded-md pointer-events-none [container-type:inline-size]">
                          <AvatarImage
                            src={value ?? undefined}
                            alt={currentClassName}
                            className="rounded-md object-cover"
                          />
                          <AvatarFallback className="rounded-md text-[50cqw]">
                            {currentClassName.slice(0, 2).toUpperCase() || "CL"}
                          </AvatarFallback>
                        </Avatar>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onChange(null)}
                          className="[grid-area:btn] self-center not-sm:w-min text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 />
                          <span>Clear Image</span>
                        </Button>
                        <DropzoneArea
                          className={cn(
                            "min-w-[260px] [grid-area:drp]",
                            false ? "opacity-60 pointer-events-none" : "",
                          )}
                        >
                          <DropzoneHeader>
                            <DropzoneMedia variant="icon">
                              <Upload />
                            </DropzoneMedia>

                            <DropzoneDescription>
                              Drag and drop or{" "}
                              <DropzoneLabel>click to upload</DropzoneLabel>
                            </DropzoneDescription>

                            <DropzoneHint>
                              SVG, PNG, JPG, or other supported image formats
                              (max. 4MB)
                            </DropzoneHint>
                          </DropzoneHeader>
                        </DropzoneArea>
                      </div>
                    </Dropzone>
                  </>
                )}
              </FormField>
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
                              <Trash2 />
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() =>
                                handleEditSchedule(index, schedule)
                              }
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
      </form>
    </>
  );
}
