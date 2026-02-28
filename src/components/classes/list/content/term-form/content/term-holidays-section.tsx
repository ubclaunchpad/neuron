"use client";

import { ArrayController } from "@/components/form/utils/ArrayController";
import { ButtonGroup } from "@/components/ui/button-group";
import { DateRangeInput } from "@/components/ui/date-input";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Button } from "@/components/primitives/button";
import { isoDateToJSDate, jsDateToIsoDate } from "@/lib/temporal-conversions";
import AddIcon from "@public/assets/icons/add.svg";
import { XIcon } from "lucide-react";
import { Controller, type FieldErrors } from "react-hook-form";
import type { TermEditSchemaInput } from "../schema";
import { useTermForm } from "../term-form-provider";

export function TermHolidaysSection() {
  const { form, fullErrors } = useTermForm();

  return (
    <FieldSet>
      <FieldLegend>Holidays</FieldLegend>
      <FieldDescription>
        Add holidays to exclude certain dates or date ranges from all classes in
        the term.
      </FieldDescription>

      <ArrayController
        control={form.control}
        name="holidays"
        keyName="key"
        render={({ fields, append, remove }) => (
          <>
            <FieldGroup>
              {fields.map((value, index) => (
                <Controller
                  key={value.key}
                  name={`holidays.${index}`}
                  control={form.control}
                  render={({
                    field: { value, onChange, ...field },
                    fieldState,
                  }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <ButtonGroup className="w-full">
                        <DateRangeInput
                          value={{
                            from: isoDateToJSDate(value!.from),
                            to: isoDateToJSDate(value!.to),
                          }}
                          onChange={(dateRange) =>
                            onChange({
                              from: jsDateToIsoDate(dateRange?.from),
                              to: jsDateToIsoDate(dateRange?.to),
                            })
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
                          startIcon={<XIcon />}
                        ></Button>
                      </ButtonGroup>
                      <FieldError
                        errors={
                          fullErrors.holidays?.[index]?.root ??
                          fullErrors.holidays?.[index]?.from ??
                          fullErrors.holidays?.[index]?.to
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
                onClick={() => append({ from: "", to: "" })}
                startIcon={<AddIcon />}
              >
                Add holiday
              </Button>
            </FieldGroup>
            <FieldError
              errors={
                (fullErrors as FieldErrors<TermEditSchemaInput>).holidays?.root
              }
            />
          </>
        )}
      />
    </FieldSet>
  );
}
