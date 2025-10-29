import { isoDateToJSDate, jsDateToIsoDate } from "@/utils/dateUtils"
import { DateInput } from "../primitives/date-input"
import { FormBase, type FormControlFunc } from "./FormBase"

export const FormDatePicker: FormControlFunc<string | undefined, { placeholder?: string }> = ({
  placeholder = "Select date",
  ...props
}) => {
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