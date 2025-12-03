import { isoDateToJSDate, jsDateToIsoDate } from "@/lib/temporal-conversions";
import { XIcon } from "lucide-react";
import type { ComponentProps } from "react";
import type {
  Control,
  ControllerProps,
  FieldPath,
  FieldValues,
} from "react-hook-form";
import { Button } from "../ui/button";
import { ButtonGroup } from "../ui/button-group";
import { DateInput } from "../ui/date-input";
import { FormFieldController } from "./FormField";
import { FormFieldLayout } from "./FormLayout";
import { cn } from "@/lib/utils";

export interface FormDateInputProps
  extends Omit<React.ComponentProps<typeof DateInput>, "value" | "onChange"> {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  clearable?: boolean;
}

function FormDateInput({
  value,
  onChange,
  clearable,
  className,
  ...props
}: FormDateInputProps) {
  const input = (
    <DateInput
      value={isoDateToJSDate(value)}
      onChange={(date) => onChange(jsDateToIsoDate(date))}
      className={cn("flex-1", className)}
      {...props}
    />
  );

  if (!clearable) {
    return input;
  }

  return (
    <ButtonGroup className="w-full">
      {input}
      <Button
        type="button"
        variant="outline"
        size="icon-lg"
        aria-label="Clear date"
        className="shrink-0"
        onClick={() => onChange(null)}
      >
        <XIcon />
      </Button>
    </ButtonGroup>
  );
}

export interface FormDateInputFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
> extends Omit<ComponentProps<typeof DateInput>, "value" | "onChange"> {
  name: TName;
  control: Control<TFieldValues, any, TTransformedValues>;
  label?: React.ReactNode;
  description?: React.ReactNode;
  required?: boolean;
  hideErrors?: boolean;
  placeholder?: string;
  clearable?: boolean;
  className?: string;
}

function FormDateInputField<
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
  clearable,
  ...inputProps
}: FormDateInputFieldProps<TFieldValues, TName, TTransformedValues>) {
  return (
    <FormFieldController name={name} control={control}>
      {({ value, onChange, ...field }) => (
        <FormFieldLayout
          label={label}
          description={description}
          required={required}
          hideErrors={hideErrors}
        >
          <FormDateInput
            clearable={clearable}
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

export { FormDateInput, FormDateInputField };
