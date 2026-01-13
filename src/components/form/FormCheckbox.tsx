import type { ComponentProps } from "react";
import type {
  Control,
  FieldPath,
  FieldValues
} from "react-hook-form";
import { Checkbox } from "../ui/checkbox";
import { FormFieldController } from "./FormField";
import { FormFieldLayout } from "./FormLayout";

export interface FormCheckboxProps
  extends Omit<
    React.ComponentProps<typeof Checkbox>,
    "checked" | "onCheckedChange" | "value" | "onChange"
  > {
  value: boolean;
  onChange: (value: boolean) => void;
}

function FormCheckbox({ value, onChange, ...props }: FormCheckboxProps) {
  return <Checkbox checked={value} onCheckedChange={onChange} {...props} />;
}

export interface FormCheckboxFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
> extends Omit<ComponentProps<typeof Checkbox>, "value" | "onChange"> {
  name: TName;
  control: Control<TFieldValues, any, TTransformedValues>;
  label?: React.ReactNode;
  description?: React.ReactNode;
  required?: boolean;
  hideErrors?: boolean;
  className?: string;
}

function FormCheckboxField<
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
}: FormCheckboxFieldProps<TFieldValues, TName, TTransformedValues>) {
  return (
    <FormFieldController name={name} control={control}>
      {({ value, onChange, ...field }) => (
        <FormFieldLayout
          label={<span className="leading-5">{label}</span>}
          description={description}
          required={required}
          hideErrors={hideErrors}
          className={className}
          orientation="horizontal"
          controlFirst
        >
          <FormCheckbox
            value={value}
            onChange={onChange}
            {...field}
            {...inputProps}
          />
        </FormFieldLayout>
      )}
    </FormFieldController>
  );
}

export { FormCheckbox, FormCheckboxField };
