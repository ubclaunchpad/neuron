import { Slider } from "@/components/ui/slider";
import type { ComponentProps } from "react";
import type {
  Control,
  ControllerProps,
  FieldPath,
  FieldValues,
} from "react-hook-form";
import { FormFieldController } from "./FormField";
import { FormFieldLayout } from "./FormLayout";

export interface FormRangeSliderProps
  extends Omit<
    React.ComponentProps<typeof Slider>,
    "value" | "onValueChange" | "onChange"
  > {
  value: [number, number];
  onChange: (value: [number, number]) => void;
}

function FormRangeSlider({ value, onChange, ...props }: FormRangeSliderProps) {
  return (
    <Slider
      value={value}
      onValueChange={(newValue) => {
        // Radix allows handles to cross over, prevent that
        onChange(
          newValue[0]! < newValue[1]!
            ? (newValue as [number, number])
            : [newValue[1]!, newValue[0]!],
        );
      }}
      {...props}
    />
  );
}

export interface FormRangeSliderFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
> extends Omit<ComponentProps<typeof FormRangeSlider>, "value" | "onChange"> {
  name: TName;
  control: Control<TFieldValues, any, TTransformedValues>;
  label?: React.ReactNode;
  description?: React.ReactNode;
  required?: boolean;
  hideErrors?: boolean;
  className?: string;
}

function FormRangeSliderField<
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
  ...sliderProps
}: FormRangeSliderFieldProps<TFieldValues, TName, TTransformedValues>) {
  return (
    <FormFieldController name={name} control={control}>
      {({ value, onChange, ...field }) => (
        <FormFieldLayout
          label={label}
          description={description}
          required={required}
          hideErrors={hideErrors}
        >
          <FormRangeSlider
            value={value}
            onChange={onChange}
            {...field}
            {...sliderProps}
          />
        </FormFieldLayout>
      )}
    </FormFieldController>
  );
}

export { FormRangeSlider, FormRangeSliderField };
