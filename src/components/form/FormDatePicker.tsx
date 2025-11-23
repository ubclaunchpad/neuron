import { isoDateToJSDate, jsDateToIsoDate } from "@/lib/temporal-conversions";
import { XIcon } from "lucide-react";
import { Button } from "../primitives/button";
import { ButtonGroup } from "../primitives/button-group";
import { DateInput } from "../primitives/date-input";
import { FormBase, type FormControlFunc } from "./FormBase";

export const FormDatePicker: FormControlFunc<{ placeholder?: string }> = ({
  placeholder = "Select date",
  ...props
}) => {
  return (
    <FormBase {...props}>
      {({ onChange, value, ...field }) => (
        <ButtonGroup className="w-full">
          <DateInput
            value={isoDateToJSDate(value)}
            onChange={(date) => onChange(jsDateToIsoDate(date))}
            className="grow-1"
            {...field}
          />
          {!props.required && <Button
            type="button"
            variant="outline"
            size="icon-lg"
            aria-label="Clear date"
            className="shrink-0"
            onClick={() => {
              console.log("change")
              onChange(null)
            }}
          >
            <XIcon className="size-4" />
          </Button>}
        </ButtonGroup>
      )}
    </FormBase>
  )
}