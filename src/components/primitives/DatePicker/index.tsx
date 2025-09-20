import { type DateValue, getLocalTimeZone, today } from "@internationalized/date";
import CaretDownIcon from "@public/assets/icons/caret-down.svg";
import { useDateFormatter } from "@react-aria/i18n";
import React from "react";
import {
  Button as AriaButton,
  DateInput as AriaDateInput,
  DatePicker as AriaDatePicker,
  DateSegment as AriaDateSegment,
  Dialog as AriaDialog,
  Group as AriaGroup,
  Label as AriaLabel,
  Popover as AriaPopover,
} from "react-aria-components";
import { Calendar } from "../Calendar";
import "./index.scss";

interface DatePickerProps
  extends Omit<React.ComponentProps<typeof AriaDatePicker>, "children"> {
  label?: string;
  placeholder?: string;
  /** 'calendar' = display-only button w/ calendar; 'field' = editable field only; 'both' = field + calendar */
  inputMode?: "field" | "calendar" | "both";
  displayFormatter?: (date: Date) => string | undefined;
  formatOptions?: Intl.DateTimeFormatOptions;
}

export function DatePicker({
  label,
  placeholder,
  defaultValue,
  inputMode = "both",
  displayFormatter,
  formatOptions,
  ...rest
}: DatePickerProps) {
  const timeZone = getLocalTimeZone();
  const df = useDateFormatter(
    formatOptions ?? { month: "long", day: "numeric", year: "numeric" }
  );

  const formatDisplay = React.useCallback(
    (value: DateValue | null) => {
      if (!value) return placeholder ?? "";
      const jsDate = value.toDate(timeZone);
      return displayFormatter?.(jsDate) ?? df.format(jsDate);
    },
    [df, displayFormatter, placeholder, timeZone]
  );

  // We never want an empty calendar date
  if (!defaultValue && inputMode === "calendar") {
    defaultValue = today(timeZone);
  }

  return (
    <AriaDatePicker {...rest} className="datepicker" defaultValue={defaultValue}>
      {(picker) => (
        <>
          {label && <AriaLabel className="datepicker__label">{label}</AriaLabel>}

          {inputMode === "calendar" && (
            <AriaGroup>
              <AriaDateInput style={{ display: 'none' }}>
                {(segment) => (
                  <AriaDateSegment
                    segment={segment}
                    className="datepicker__segment"
                  />
                )}
              </AriaDateInput>

              <AriaButton
                slot="trigger"
                className="datepicker__field datepicker__field-trigger"
                aria-label={label || placeholder || "Open calendar"}
              >
                <span className="datepicker__input">
                  {formatDisplay(picker.state.value as DateValue | null)}
                </span>
                <CaretDownIcon className="datepicker__trigger" />
              </AriaButton>
            </AriaGroup>
          )}

          {inputMode !== "calendar" && (
            <AriaGroup className="datepicker__field">
              <AriaDateInput
                className="datepicker__input"
                aria-label={label || placeholder || "Date"}
              >
                {(segment) => (
                  <AriaDateSegment
                    segment={segment}
                    className="datepicker__segment"
                  />
                )}
              </AriaDateInput>

              {inputMode === "both" && (
                <AriaButton
                  slot="trigger"
                  className="datepicker__trigger"
                  aria-label="Open calendar"
                >
                  <CaretDownIcon />
                </AriaButton>
              )}
            </AriaGroup>
          )}

          {inputMode !== "field" && (
            <AriaPopover className="datepicker__popover" placement="bottom start">
              <AriaDialog className="datepicker__dialog">
                <Calendar />
              </AriaDialog>
            </AriaPopover>
          )}
        </>
      )}
    </AriaDatePicker>
  );
}
