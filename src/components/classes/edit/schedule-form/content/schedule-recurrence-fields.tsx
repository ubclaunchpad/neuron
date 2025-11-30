import {
  Controller,
  useFormState,
  useWatch,
  type Control,
  type FieldErrors,
} from "react-hook-form";

import { FormInputField } from "@/components/form/FormInput";
import { PrimitiveArrayController } from "@/components/form/utils/PrimitiveArrayController";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { DateInput } from "@/components/ui/date-input";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { SelectItem } from "@/components/ui/select";
import { isoDateToJSDate, jsDateToIsoDate } from "@/lib/temporal-conversions";
import { ScheduleType, WeekdayEnum } from "@/models/api/schedule";
import type { DeepAllUnionFields } from "@/utils/typeUtils";
import AddIcon from "@public/assets/icons/add.svg";
import { XIcon } from "lucide-react";
import { FormSelectField } from "@/components/form/FormSelect";
import type { ScheduleEditSchemaInput, ScheduleFormControl } from "../schema";

interface ScheduleRecurrenceFieldsProps {
  control: ScheduleFormControl;
  fullErrors: FieldErrors<DeepAllUnionFields<ScheduleEditSchemaInput>>;
}

export function ScheduleRecurrenceFields({
  control,
  initial,
}: {
  control: ScheduleFormControl;
  initial: ScheduleEditSchemaInput;
}) {
  // Watch the minimal type, needed for conditional UI
  const ruleType = useWatch({
    control,
    name: "rule.type",
    defaultValue: initial.rule.type,
  });

  // Deep union to get all type combinations for errors
  const { errors } = useFormState({ control });
  const fullErrors: FieldErrors<DeepAllUnionFields<ScheduleEditSchemaInput>> =
    errors;

  return (
    <FieldSet>
      <FormSelectField
        control={control}
        name="rule.type"
        label="Frequency"
        placeholder="Select frequency"
        required
      >
        <SelectItem key={ScheduleType.weekly} value={ScheduleType.weekly}>
          Weekly
        </SelectItem>
        <SelectItem key={ScheduleType.monthly} value={ScheduleType.monthly}>
          Monthly
        </SelectItem>
        <SelectItem key={ScheduleType.single} value={ScheduleType.single}>
          Choose Dates
        </SelectItem>
      </FormSelectField>

      {ruleType === "weekly" && (
        <WeeklyFields control={control} fullErrors={fullErrors} />
      )}

      {ruleType === "monthly" && (
        <MonthlyFields control={control} fullErrors={fullErrors} />
      )}

      {ruleType === "single" && (
        <SingleDateFields control={control} fullErrors={fullErrors} />
      )}
    </FieldSet>
  );
}

function WeeklyFields({
  control,
  fullErrors,
}: {
  control: ScheduleFormControl;
  fullErrors: FieldErrors<DeepAllUnionFields<ScheduleEditSchemaInput>>;
}) {
  return (
    <Field>
      <FieldLabel>Recurrence</FieldLabel>
      <span className="flex flex-row items-center gap-2 md:gap-3">
        <span className="text-muted-foreground shrink-0">Every</span>
        <FormInputField
          control={control}
          name="rule.interval"
          type="number"
          placeholder="Select week"
          className="flex-1"
          hideErrors
        />
        <span className="text-muted-foreground shrink-0">weeks on</span>
        <FormSelectField
          control={control}
          name="rule.weekday"
          placeholder="Select day"
          className="flex-1"
          hideErrors
        >
          {Object.entries(WeekdayEnum.def.entries).map(([label, value]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </FormSelectField>
      </span>
      <FieldError
        errors={fullErrors.rule?.interval ?? fullErrors.rule?.weekday}
      />
    </Field>
  );
}

function MonthlyFields({
  control,
  fullErrors,
}: {
  control: ScheduleFormControl;
  fullErrors: FieldErrors<DeepAllUnionFields<ScheduleEditSchemaInput>>;
}) {
  return (
    <Field>
      <FieldLabel>Recurrence</FieldLabel>
      <span className="flex flex-row items-center gap-2 md:gap-3">
        <span className="text-muted-foreground shrink-0">
          Every month on the
        </span>
        <FormSelectField
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
        </FormSelectField>
        <FormSelectField
          control={control}
          name="rule.weekday"
          placeholder="Select day"
          className="flex-1"
          hideErrors
        >
          {Object.entries(WeekdayEnum.def.entries).map(([label, value]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </FormSelectField>
      </span>
      <FieldError errors={fullErrors.rule?.nth ?? fullErrors.rule?.weekday} />
    </Field>
  );
}

function SingleDateFields({
  control,
  fullErrors,
}: {
  control: ScheduleFormControl;
  fullErrors: FieldErrors<DeepAllUnionFields<ScheduleEditSchemaInput>>;
}) {
  return (
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
                          onChange={(date) => onChange(jsDateToIsoDate(date))}
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
                        errors={fullErrors.rule?.extraDates?.[index]}
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
  );
}
