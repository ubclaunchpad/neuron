import CaretLeftIcon from "@public/assets/icons/caret-left.svg";
import CaretRightIcon from "@public/assets/icons/caret-right.svg";
import React from "react";
import {
  Button as AriaButton,
  Calendar as AriaCalendar,
  CalendarCell as AriaCalendarCell,
  CalendarGrid as AriaCalendarGrid,
  CalendarGridBody as AriaCalendarGridBody,
  CalendarGridHeader as AriaCalendarGridHeader,
  CalendarHeaderCell as AriaCalendarHeaderCell,
  Heading as AriaHeading
} from "react-aria-components";
import "./index.scss";

type CalendarProps = Omit<
  React.ComponentProps<typeof AriaCalendar>,
  "children"
>;

export function Calendar(props: CalendarProps) {
  return (
    <AriaCalendar
      {...props}
      className="calendar"
      visibleDuration={{ months: 1 }}
    >
      <div className="calendar__header">
        <AriaHeading className="calendar__title" />
        <div className="calendar__nav-group">
          <AriaButton
            slot="previous"
            className="calendar__nav"
            aria-label="Previous month"
          >
            <CaretLeftIcon />
          </AriaButton>
          <AriaButton
            slot="next"
            className="calendar__nav"
            aria-label="Next month"
          >
            <CaretRightIcon />
          </AriaButton>
        </div>
      </div>
      <AriaCalendarGrid className="calendar__grid">
        <AriaCalendarGridHeader className="calendar__dow">
          {(day) => (
            <AriaCalendarHeaderCell className="calendar__dow-cell">
              {day}
            </AriaCalendarHeaderCell>
          )}
        </AriaCalendarGridHeader>
        <AriaCalendarGridBody>
          {(date) => (
            <AriaCalendarCell date={date} className="calendar__cell" />
          )}
        </AriaCalendarGridBody>
      </AriaCalendarGrid>
    </AriaCalendar>
  );
}
