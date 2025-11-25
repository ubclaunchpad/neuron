'use client'

import { cn } from '@/lib/utils'
import { CalendarIcon } from 'lucide-react'
import * as React from 'react'

import type { DateRange } from 'react-day-picker'
import { Button } from './button'
import { Calendar } from './calendar'
import { Popover, PopoverContent, PopoverTrigger } from './popover'

const defaultDateFormat: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
}

function defaultFormatDateLabel(date: Date, fmt = defaultDateFormat, locale = 'en-US') {
  return date.toLocaleDateString(locale, fmt)
}

type CalendarOwnProps = Omit<React.ComponentProps<typeof Calendar>, 'mode' | 'selected' | 'onSelect'>

export type DatePickerProps = Omit<React.ComponentProps<typeof Button>, 'children' | 'id' | 'value' | 'defaultValue' | 'onChange' | 'onBlur'> & {
  /** Controlled value. If provided, component is controlled. */
  value?: Date | null
  /** Uncontrolled initial value. */
  defaultValue?: Date
  /** Change handler (fires for both controlled & uncontrolled). */
  onChange?: (date: Date | undefined) => void
  /** Called when the popover closes. */
  onBlur?: () => void
  /** Optional id for accessibility wiring. */
  id?: string
  /** Placeholder text when no date is selected. */
  placeholder?: string
  /** Custom formatter for the button label. */
  formatDateLabel?: (date: Date) => string
  /** Pass-through props to the internal Calendar. */
  calendarProps?: CalendarOwnProps
}

export function DatePicker({
  value,
  defaultValue,
  onChange,
  onBlur,
  id,
  placeholder = 'Pick a date',
  disabled,
  className,
  formatDateLabel = defaultFormatDateLabel,
  calendarProps,
  ...buttonProps
}: DatePickerProps) {
  const isControlled = onChange !== undefined
  const [open, setOpen] = React.useState(false)

  const [internal, setInternal] = React.useState<Date | undefined>(defaultValue)
  const selected = (isControlled ? value ?? undefined : internal)

  const setSelected = (next: Date | undefined) => {
    if (!isControlled) setInternal(next)
    onChange?.(next)
  }

  // Keep in sync
  React.useEffect(() => {
    if (!isControlled) setInternal(value ?? undefined);
  }, [value])

  const label = selected
    ? formatDateLabel(selected)
    : undefined

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) onBlur?.()
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          id={id}
          disabled={disabled}
          className={cn('justify-start min-w-0 shrink-1 font-normal', !selected && 'text-muted-foreground', className)}
          {...buttonProps}
        >
          <CalendarIcon className="size-4" />
          <span className="text-base truncate">{label ?? placeholder}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto overflow-hidden p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(d) => {
            // react-day-picker sends undefined when toggling the same day
            setSelected(d)
            setOpen(false)
          }}
          autoFocus
          captionLayout="dropdown"
          startMonth={new Date(new Date().getFullYear() - 5, 11, 31)}
          endMonth={new Date(new Date().getFullYear() + 5, 11, 31)}
          {...calendarProps}
        />
      </PopoverContent>
    </Popover>
  )
}

export type DateRangePickerProps = Omit<React.ComponentProps<typeof Button>, 'children' | 'id' | 'value' | 'defaultValue' | 'onChange' | 'onBlur'> & {
  /** Controlled value. If provided, component is controlled. */
  value?: DateRange
  /** Uncontrolled initial value. */
  defaultValue?: DateRange
  /** Change handler (fires for both controlled & uncontrolled). */
  onChange?: (range: DateRange | undefined) => void
  /** Called when the popover closes. */
  onBlur?: () => void
  /** Optional id for accessibility wiring. */
  id?: string
  /** Placeholder when no range is selected. */
  placeholder?: string
  /** Number of months to render in the calendar. */
  numberOfMonths?: number
  /** Custom formatter for the button label. */
  formatRangeLabel?: (from: Date, to: Date) => string
  /** Pass-through props to the internal Calendar. */
  calendarProps?: Omit<CalendarOwnProps, 'numberOfMonths'>
}

export function DateRangePicker({
  value,
  defaultValue,
  onChange,
  onBlur,
  id,
  placeholder = 'Select a date or date range',
  numberOfMonths = 1,
  disabled,
  className,
  formatRangeLabel,
  calendarProps,
  ...buttonProps
}: DateRangePickerProps) {
  const isControlled = value !== undefined
  const [open, setOpen] = React.useState(false)

  const [internal, setInternal] = React.useState<DateRange | undefined>(defaultValue)
  const selected = isControlled ? value : internal

  const setSelected = (next: DateRange | undefined) => {
    if (!isControlled) setInternal(next)
    onChange?.(next)
  }

  formatRangeLabel = formatRangeLabel ?? ((from: Date, to: Date): string => {
    const fromLabel = defaultFormatDateLabel(from);
    const toLabel = defaultFormatDateLabel(to);
    if (fromLabel === toLabel) return fromLabel;
    return `${fromLabel} - ${toLabel}`;
  })

  const label = selected?.from && selected?.to
    ? formatRangeLabel(selected.from, selected.to)
    : undefined

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) onBlur?.()
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          id={id}
          disabled={disabled}
          className={cn('justify-start min-w-0 shrink-1 font-normal', !label && 'text-muted-foreground', className)}
          {...buttonProps}
        >
          <CalendarIcon className="size-4" />
          <span className="text-base">{label ?? placeholder}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto overflow-hidden p-0" align="start">
        <Calendar
          mode="range"
          selected={selected}
          onSelect={(r) => setSelected(r)}
          numberOfMonths={numberOfMonths}
          autoFocus
          disabled={disabled}
          captionLayout="dropdown"
          {...calendarProps}
        />
      </PopoverContent>
    </Popover>
  )
}

export { DatePicker as DateInput, DateRangePicker as DateRangeInput }
