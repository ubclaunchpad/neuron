import type { ComponentProps } from "react";
import type {
  Control,
  FieldPath,
  FieldValues
} from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { FormFieldController } from "./FormField";
import { FormFieldLayout, type FormFieldLayoutProps } from "./FormLayout";

export interface FormSelectProps
  extends Omit<React.ComponentProps<typeof Select>, "value" | "onValueChange"> {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  id: string;
  "aria-invalid": boolean;
  className?: string;
}

function FormSelect({
  value,
  onChange,
  onBlur,
  placeholder,
  id,
  "aria-invalid": ariaInvalid,
  className,
  children,
  ...props
}: FormSelectProps) {
  return (
    <Select value={value} onValueChange={onChange} {...props}>
      <SelectTrigger
        aria-invalid={ariaInvalid}
        id={id}
        onBlur={onBlur}
        className="shadow-xs"
      >
        <SelectValue placeholder={placeholder} className={className} />
      </SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
  );
}

export interface FormSelectFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
> extends Omit<ComponentProps<typeof Select>, "value" | "onChange"> {
  name: TName;
  control: Control<TFieldValues, any, TTransformedValues>;
  label?: React.ReactNode;
  description?: React.ReactNode;
  orientation?: FormFieldLayoutProps["orientation"]
  required?: boolean;
  hideErrors?: boolean;
  placeholder?: string;
  className?: string;
  children: React.ReactNode;
}

function FormSelectField<
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
  orientation,
  placeholder,
  className,
  children,
  ...inputProps
}: FormSelectFieldProps<TFieldValues, TName, TTransformedValues>) {
  return (
    <FormFieldController name={name} control={control}>
      {({ value, onChange, ...field }) => (
        <FormFieldLayout
          label={label}
          description={description}
          required={required}
          hideErrors={hideErrors}
          orientation={orientation}
        >
          <FormSelect
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className={className}
            {...field}
            {...inputProps}
          >
            {children}
          </FormSelect>
        </FormFieldLayout>
      )}
    </FormFieldController>
  );
}

export { FormSelect, FormSelectField };
