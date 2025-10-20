import * as React from "react";

import { CalendarIcon } from "lucide-react";
import { Calendar } from "./calendar";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "./input-group";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";


type DateInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "defaultValue" | "onChange"> & {
  /** Controlled date value */
  value?: string | Date | null
  /** Uncontrolled initial date */
  defaultValue?: Date | null
  /** Change handler for controlled usage */
  onChange?: (date: Date | null) => void
  /** Name used for hidden ISO input value (yyyy-mm-dd) in HTML form posts */
  name?: string
  /** Display formatting options */
  displayFormat?: Intl.DateTimeFormatOptions
}


const defaultFormat: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "long",
  year: "numeric",
}

function isValidDate(d: unknown): d is Date {
  return d instanceof Date && !isNaN(d.getTime())
}

function formatDate(d: Date | null | undefined, fmt = defaultFormat, locale = "en-US") {
  return d ? d.toLocaleDateString(locale, fmt) : ""
}

function parseLooseDate(input: string): Date | null {
  const s = input.trim()
  if (!s) return null
  const dt = new Date(s)
  return isValidDate(dt) ? dt : null
}

export function DateInput({
  value: controlledDate,
  defaultValue = null,
  onChange,
  displayFormat = defaultFormat,
  id,
  placeholder = "Select a date",
  disabled,
  ...rest
}: DateInputProps) {
  const isControlled = controlledDate !== undefined
  const [open, setOpen] = React.useState(false)

  // Internal date for uncontrolled usage
  const [uncontrolledDate, setUncontrolledDate] = React.useState<Date | null>(defaultValue)
  controlledDate = typeof controlledDate === "string" ? new Date(controlledDate) : controlledDate
  const date = (isControlled ? controlledDate : uncontrolledDate) ?? null

  // Track calendar month separately so changing months doesn’t mutate selected date
  const [month, setMonth] = React.useState<Date | undefined>(date ?? undefined)

  // Input text value (what the user sees / types)
  const [text, setText] = React.useState<string>(formatDate(date, displayFormat))

  // Keep input text in sync when the external date changes
  React.useEffect(() => {
    setText(formatDate(date, displayFormat))
    if (date) setMonth(date)
  }, [date, displayFormat])

  const commitDate = (next: Date | null) => {
    if (isControlled) {
      onChange?.(next ?? null)
    } else {
      setUncontrolledDate(next ?? null)
      onChange?.(next ?? null)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value)
  }

  const tryParseAndCommit = () => {
    console.log('blur')
    const parsed = parseLooseDate(text)
    console.log('parsed', parsed)
    if (parsed) {
      commitDate(parsed)
      setText(formatDate(parsed, displayFormat))
      setMonth(parsed)
      return true
    }

    // Revert to last valid date text if parse fails
    setText(formatDate(date, displayFormat))
    return false
  }

  return (
    <InputGroup>
      <InputGroupInput
        id={id}
        role="combobox"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={id ? `${id}-popover` : undefined}
        placeholder={placeholder}
        disabled={disabled}
        value={text}
        onChange={handleInputChange}
        onBlurCapture={tryParseAndCommit}
        {...rest}
      />

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <InputGroupAddon align="inline-end">
              <InputGroupButton size="icon-xs">
                <CalendarIcon className="size-3.5" />
                <span className="sr-only">Select date</span>
              </InputGroupButton>
            </InputGroupAddon>
          </PopoverTrigger>
          <PopoverContent
            id={id ? `${id}-popover` : undefined}
            className="w-auto overflow-hidden p-0"
            align="end"
            alignOffset={-8}
            sideOffset={10}
          >
            <Calendar
              mode="single"
              captionLayout="dropdown"
              className="rounded-md border shadow-sm"
              selected={date ?? undefined}
              month={month}
              onMonthChange={setMonth}
              onSelect={(d) => {
                // react-day-picker gives undefined when clicking the already-selected date
                // so guard it
                if (!d) return
                commitDate(d)
                setText(formatDate(d, displayFormat))
                setMonth(d)
                console.log('select')
                setOpen(false)
              }}
            />
          </PopoverContent>
        </Popover>
    </InputGroup>
  )
}