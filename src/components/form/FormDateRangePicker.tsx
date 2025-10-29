import { isoDateToJSDate, jsDateToIsoDate } from "@/utils/dateUtils"
import { DateRangeInput } from "../primitives/date-input"
import { FormBase, type FormControlFunc } from "./FormBase"

export const FormDateRangePicker: FormControlFunc<{ placeholder?: string }> = ({
  placeholder,
  ...props
}) => {
  return (
    <FormBase {...props} >
      {({ onChange, value, ...field }) => (
        <DateRangeInput
          value={{
            from: isoDateToJSDate(value.from),
            to: isoDateToJSDate(value.to)
          }}
          onChange={dateRange => onChange({
            from: jsDateToIsoDate(dateRange?.from),
            to: jsDateToIsoDate(dateRange?.to)
          })}
          placeholder={placeholder}
          {...field}
        />
      )}
    </FormBase>
  )
}