import { Slider } from "@radix-ui/react-slider";
import { FormBase, type FormControlFunc } from "./FormBase";

export const FormRangeSlider: FormControlFunc<{ 
  min?: number;
  max?: number;
  step?: number;
  bottomSlot?: React.ReactNode
}> = ({
  min,
  max,
  step,
  ...props
}) => {
  return <FormBase {...props}>
    {({ onChange, value, ...field }) => (
      <Slider 
        min={min}
        max={max} 
        step={step}
        value={value}
        onValueChange={(value) => {
          if (value.length === 2) {
            // Radix allows the handles to cross over
            onChange(value[0]! < value[1]! ? value : [value[1], value[0]]);
          }
        }}
        {...field}
      />
    )}
  </FormBase>
}
