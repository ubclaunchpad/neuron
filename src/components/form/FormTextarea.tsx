import { cn } from "@/lib/utils";
import type {
  Control,
  ControllerProps,
  FieldPath,
  FieldValues,
} from "react-hook-form";
import { Textarea } from "../ui/textarea";
import { FormFieldController } from "./FormField";
import { FormFieldLayout } from "./FormLayout";

export interface FormTextareaProps
  extends Omit<React.ComponentProps<typeof Textarea>, "value" | "onChange"> {
  value: string;
  onChange: (value: string) => void;
}

function FormTextarea({ value, onChange, ...props }: FormTextareaProps) {
  return (
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      {...props}
    />
  );
}

export interface FormTextareaFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
> {
  name: TName;
  control: Control<TFieldValues, any, TTransformedValues>;
  label?: React.ReactNode;
  description?: React.ReactNode;
  required?: boolean;
  hideErrors?: boolean;
  placeholder?: string;
  rows?: number;
  resizable?: boolean;
  className?: string;
}

function FormTextareaField<
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
  resizable = false,
  rows = 3,
  className,
  ...textareaProps
}: FormTextareaFieldProps<TFieldValues, TName, TTransformedValues>) {
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
          <FormTextarea
            value={value}
            onChange={onChange}
            rows={rows}
            className={cn(resizable && "resize-none")}
            {...textareaProps}
            {...field}
          />
        </FormFieldLayout>
      )}
    </FormFieldController>
  );
}

export { FormTextarea, FormTextareaField };
