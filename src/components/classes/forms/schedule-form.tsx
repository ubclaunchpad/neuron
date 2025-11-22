"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/primitives/accordion";
import { Button } from "@/components/primitives/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldTitle,
} from "@/components/primitives/field";
import { SelectItem } from "@/components/primitives/select";
import { ScheduleType, WeekdayEnum } from "@/models/api/schedule";
import { XIcon } from "lucide-react";
import {
  Controller,
  useForm,
  useWatch,
  type FieldErrors,
} from "react-hook-form";

import { FormInput } from "@/components/form/FormInput";
import { PrimitiveArrayController } from "@/components/form/utils/PrimitiveArrayController";
import { ButtonGroup } from "@/components/primitives/button-group";
import { DateInput } from "@/components/primitives/date-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/primitives/dialog";
import { isoDateToJSDate, jsDateToIsoDate } from "@/lib/temporal-conversions";
import type { DeepAllUnionFields } from "@/utils/typeUtils";
import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { zodResolver } from "@hookform/resolvers/zod";
import AddIcon from "@public/assets/icons/add.svg";
import { DialogClose } from "@radix-ui/react-dialog";
import { useCallback } from "react";
import z from "zod";
import { FormDatePicker } from "../../form/FormDatePicker";
import { FormSelect } from "../../form/FormSelect";

const Single = z.object({
  type: z.literal("single"),
  extraDates: z.array(z.iso.date("Please fill out this field.")).min(1),
});

const Weekly = z.object({
  type: z.literal("weekly"),
  weekday: z.string().min(1, "Please select a weekday.").pipe(WeekdayEnum),
  interval: z.coerce
    .number("Please fill out this field.")
    .int("Please enter only whole numbers.")
    .min(1, "Interval must be at least 1."),
});

const Monthly = z.object({
  type: z.literal("monthly"),
  weekday: z.string().min(1, "Please select a weekday.").pipe(WeekdayEnum),
  nth: z.coerce
    .number("Please fill out this field.")
    .int("Please enter only whole numbers.")
    .min(1)
    .max(5),
});

export const ScheduleRuleEditSchema = z.discriminatedUnion("type", [
  Single,
  Weekly,
  Monthly,
]);
export type ScheduleRuleEditSchemaType = z.infer<typeof ScheduleRuleEditSchema>;

export const ScheduleEditSchema = z.object({
  id: z.uuid().optional(),
  localStartTime: z.iso.time("Please fill out this field."),
  localEndTime: z.iso.time("Please fill out this field."),
  volunteerUserIds: z.array(z.uuid()).default([]),
  instructorUserIds: z.array(z.uuid()).default([]),
  effectiveStart: z.iso.date().optional(),
  effectiveEnd: z.iso.date().optional(),
  rule: ScheduleRuleEditSchema,
});
export type ScheduleEditSchemaInput = z.input<typeof ScheduleEditSchema>;
export type ScheduleEditSchemaOutput = z.output<typeof ScheduleEditSchema>;

export const ScheduleFormDialog = NiceModal.create(
  ({
    initial,
    isEditing,
  }: {
    initial: ScheduleEditSchemaInput;
    isEditing?: boolean;
  }) => {
    const modal = useModal();

    const { control, formState, handleSubmit, reset } = useForm({
      resolver: zodResolver(ScheduleEditSchema),
      values: initial,
      mode: "onSubmit",
      reValidateMode: "onChange",
    });

    // Deep union to get all type combinations for errors
    const fullErrors: FieldErrors<DeepAllUnionFields<ScheduleEditSchemaInput>> =
      formState.errors;

    // Watch the minimal type, needed for conditional UI
    const ruleType = useWatch({
      control,
      name: "rule.type",
      defaultValue: initial.rule.type,
    });

    const onSubmit = useCallback(
      async (data: ScheduleEditSchemaOutput) => {
        await modal.resolve(data);
        await modal.hide();
      },
      [modal],
    );

    return (
      <Dialog
        open={modal.visible}
        onOpenChange={async (open) => {
          if (open) {
            reset(initial);
            await modal.show();
          } else {
            await modal.hide();
            await modal.reject();
          }
        }}
      >
        <DialogContent asChild>
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>
                {isEditing ? "Edit schedule" : "Add a schedule"}
              </DialogTitle>
              <DialogDescription>
                Configure the timing and recurrence for this class schedule.
              </DialogDescription>
            </DialogHeader>

            <FieldGroup>
              <FieldGroup className="flex-row">
                {/* Start time */}
                <FormInput
                  control={control}
                  name="localStartTime"
                  type="time"
                  label="Start Time"
                  required
                />

                {/* End time */}
                <FormInput
                  control={control}
                  name="localEndTime"
                  type="time"
                  label="End Time"
                  required
                />
              </FieldGroup>

              {/* Recurrence type */}
              <FieldSet>
                <FormSelect
                  control={control}
                  name="rule.type"
                  label="Frequency"
                  placeholder="Select frequency"
                  required
                >
                  <SelectItem
                    key={ScheduleType.weekly}
                    value={ScheduleType.weekly}
                  >
                    Weekly
                  </SelectItem>
                  <SelectItem
                    key={ScheduleType.monthly}
                    value={ScheduleType.monthly}
                  >
                    Monthly
                  </SelectItem>
                  <SelectItem
                    key={ScheduleType.single}
                    value={ScheduleType.single}
                  >
                    Choose Dates
                  </SelectItem>
                </FormSelect>

                {/* WEEKLY FIELDS */}
                {ruleType === "weekly" && (
                  <Field>
                    <FieldLabel>Recurrence</FieldLabel>

                    <span className="flex flex-row items-center gap-2 md:gap-3">
                      <span className="text-muted-foreground shrink-0">
                        Every
                      </span>

                      <FormInput
                        control={control}
                        name="rule.interval"
                        placeholder="Select week"
                        className="flex-1"
                        hideErrors
                      />

                      <span className="text-muted-foreground shrink-0">
                        weeks on
                      </span>

                      <FormSelect
                        control={control}
                        name="rule.weekday"
                        placeholder="Select day"
                        className="flex-1"
                        hideErrors
                      >
                        {Object.entries(WeekdayEnum.def.entries).map(
                          ([label, value]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ),
                        )}
                      </FormSelect>
                    </span>
                    <FieldError
                      errors={
                        fullErrors.rule?.interval ?? fullErrors.rule?.weekday
                      }
                    />
                  </Field>
                )}

                {/* MONTHLY FIELDS */}
                {ruleType === "monthly" && (
                  <Field>
                    <FieldLabel>Recurrence</FieldLabel>

                    <span className="flex flex-row items-center gap-2 md:gap-3">
                      <span className="text-muted-foreground shrink-0">
                        Every month on the
                      </span>

                      <FormSelect
                        control={control}
                        name="rule.nth"
                        placeholder="Select Week"
                        className="flex-1"
                        hideErrors
                      >
                        <SelectItem value="1">First</SelectItem>
                        <SelectItem value="2">Second</SelectItem>
                        <SelectItem value="3">Third</SelectItem>
                        <SelectItem value="4">Fourth</SelectItem>
                        <SelectItem value="5">Fifth</SelectItem>
                      </FormSelect>

                      <FormSelect
                        control={control}
                        name="rule.weekday"
                        placeholder="Select day"
                        className="flex-1"
                        hideErrors
                      >
                        {Object.entries(WeekdayEnum.def.entries).map(
                          ([label, value]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ),
                        )}
                      </FormSelect>
                    </span>
                    <FieldError
                      errors={fullErrors.rule?.nth ?? fullErrors.rule?.weekday}
                    />
                  </Field>
                )}

                {/* SINGLE-DATE FIELDS */}
                {ruleType === "single" && (
                  <FieldSet>
                    <FieldContent>
                      <FieldTitle>Specific Dates</FieldTitle>
                      <FieldDescription>
                        Add one or more specific dates for this class.
                      </FieldDescription>
                    </FieldContent>

                    <PrimitiveArrayController
                      control={control}
                      name="rule.extraDates"
                      render={({ fields, append, remove }) => (
                        <>
                          <FieldGroup>
                            {fields.map((_, index) => (
                              <Controller
                                key={index}
                                name={`rule.extraDates.${index}`}
                                control={control}
                                render={({
                                  field: { value, onChange, ...field },
                                  fieldState,
                                }) => (
                                  <Field data-invalid={fieldState.invalid}>
                                    <ButtonGroup className="w-full">
                                      <DateInput
                                        value={isoDateToJSDate(value)}
                                        onChange={(date) =>
                                          onChange(jsDateToIsoDate(date))
                                        }
                                        className="flex-1"
                                        {...field}
                                      />
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="icon-lg"
                                        aria-label={`Remove holiday ${index + 1}`}
                                        className="shrink-0"
                                        onClick={() => remove(index)}
                                      >
                                        <XIcon className="size-4" />
                                      </Button>
                                    </ButtonGroup>
                                    <FieldError
                                      errors={
                                        fullErrors.rule?.extraDates?.[index]
                                      }
                                    />
                                  </Field>
                                )}
                              />
                            ))}

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="self-start px-0 text-muted-foreground hover:text-foreground"
                              onClick={() => append("")}
                            >
                              <AddIcon />
                              <span>Add a date</span>
                            </Button>
                          </FieldGroup>
                        </>
                      )}
                    />
                    <FieldError
                      errors={
                        Array.isArray(fullErrors.rule?.extraDates)
                          ? undefined
                          : fullErrors.rule?.extraDates
                      }
                    />
                  </FieldSet>
                )}
              </FieldSet>

              {/* Advanced dates */}
              <Accordion
                type="single"
                collapsible
                className="w-full border-t mt-4"
              >
                <AccordionItem value="effective-dates" className="px-2">
                  <AccordionTrigger className="hover:no-underline">
                    Override Term Dates
                  </AccordionTrigger>
                  <AccordionContent>
                    <FieldContent>
                      <FieldDescription>
                        These dates override the term dates. Use them to specify
                        a custom start and end date for this specific schedule,
                        independent of the overall term dates.
                      </FieldDescription>

                      <div className="grid gap-6 md:grid-cols-2">
                        <FormDatePicker
                          control={control}
                          name="effectiveStart"
                          label="Override Start Date"
                        />

                        <FormDatePicker
                          control={control}
                          name="effectiveEnd"
                          label="Override End Date"
                        />
                      </div>
                    </FieldContent>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </FieldGroup>

            <DialogFooter>
              <DialogClose asChild>
                <Button size="sm" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" size="sm">
                Done
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  },
);
