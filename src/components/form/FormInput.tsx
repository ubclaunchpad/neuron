import type { ComponentProps } from "react";
import type {
  Control,
  ControllerProps,
  FieldPath,
  FieldValues,
} from "react-hook-form";
import { Input, PasswordInput } from "../ui/input";
import { FormFieldController } from "./FormField";
import { FormFieldLayout } from "./FormLayout";
import type { VariantProps } from "class-variance-authority";
import type { fieldVariants } from "../ui/field";

export interface FormInputProps
  extends Omit<React.ComponentProps<typeof Input>, "value" | "onChange"> {
  value: string;
  onChange: (value: string) => void;
}

function FormInput({ value, onChange, type, ...props }: FormInputProps) {
  const InputComp = type === "password" ? PasswordInput : Input;
  return (
    <InputComp
      value={value}
      onChange={(e) => onChange(e.target.value)}
      {...props}
    />
  );
}

export interface FormInputFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
> extends Omit<ComponentProps<"input">, "value" | "onChange"> {
  name: TName;
  control: Control<TFieldValues, any, TTransformedValues>;
  label?: React.ReactNode;
  description?: React.ReactNode;
  required?: boolean;
  hideErrors?: boolean;
  orientation?: VariantProps<typeof fieldVariants>["orientation"];
  fieldClassName?: string;
}

function FormInputField<
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
  fieldClassName,
  orientation,
  ...inputProps
}: FormInputFieldProps<TFieldValues, TName, TTransformedValues>) {
  return (
    <FormFieldController name={name} control={control}>
      {(field) => (
        <FormFieldLayout
          label={label}
          description={description}
          required={required}
          hideErrors={hideErrors}
          className={fieldClassName}
          orientation={orientation}
        >
          <FormInput {...inputProps} {...field} />
        </FormFieldLayout>
      )}
    </FormFieldController>
  );
}

export { FormInput, FormInputField };
