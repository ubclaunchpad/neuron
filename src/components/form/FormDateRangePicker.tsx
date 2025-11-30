import { isoDateToJSDate, jsDateToIsoDate } from "@/lib/temporal-conversions";
import type { ComponentProps } from "react";
import type {
  Control,
  ControllerProps,
  FieldPath,
  FieldValues,
} from "react-hook-form";
import { DateRangeInput } from "../ui/date-input";
import { FormFieldController } from "./FormField";
import { FormFieldLayout } from "./FormLayout";

export interface FormDateRangeInputProps
  extends Omit<
    React.ComponentProps<typeof DateRangeInput>,
    "value" | "onChange"
  > {
  value: { from: string | null | undefined; to: string | null | undefined };
  onChange: (value: { from: string | null; to: string | null }) => void;
}

function FormDateRangeInput({
  value,
  onChange,
  ...props
}: FormDateRangeInputProps) {
  return (
    <DateRangeInput
      value={{
        from: isoDateToJSDate(value.from),
        to: isoDateToJSDate(value.to),
      }}
      onChange={(dateRange) =>
        onChange({
          from: jsDateToIsoDate(dateRange?.from),
          to: jsDateToIsoDate(dateRange?.to),
        })
      }
      {...props}
    />
  );
}

export interface FormDateRangeInputFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
> extends Omit<ComponentProps<typeof DateRangeInput>, "value" | "onChange"> {
  name: TName;
  control: Control<TFieldValues, any, TTransformedValues>;
  label?: React.ReactNode;
  description?: React.ReactNode;
  required?: boolean;
  hideErrors?: boolean;
  placeholder?: string;
  className?: string;
}

function FormDateRangeInputField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
>({
  name,
  control,
  label,
  description,
  required,
  hideErrors,
  className,
  ...inputProps
}: FormDateRangeInputFieldProps<TFieldValues, TName, TTransformedValues>) {
  return (
    <FormFieldController name={name} control={control}>
      {({ value, onChange, ...field }) => (
        <FormFieldLayout
          label={label}
          description={description}
          required={required}
          hideErrors={hideErrors}
          className={className}
        >
          <FormDateRangeInput
            value={value}
            onChange={onChange}
            {...inputProps}
            {...field}
          />
        </FormFieldLayout>
      )}
    </FormFieldController>
  );
}

export { FormDateRangeInput, FormDateRangeInputField };
