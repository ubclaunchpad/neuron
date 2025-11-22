import { isoDateToJSDate, jsDateToIsoDate } from "@/lib/temporal-conversions";
import { DateInput } from "../primitives/date-input";
import { FormBase, type FormControlFunc } from "./FormBase";

export const FormDatePicker: FormControlFunc<{ placeholder?: string }> = ({
  placeholder = "Select date",
  ...props
}) => {
  const currentYear = new Date().getFullYear();

  return (
    <FormBase {...props}>
      {({ onChange, value, ...field }) => (
        <DateInput
          value={isoDateToJSDate(value)}
          onChange={date => onChange(jsDateToIsoDate(date))}
          placeholder={placeholder}
          {...field}
        />
      )}
    </FormBase>
  )
}