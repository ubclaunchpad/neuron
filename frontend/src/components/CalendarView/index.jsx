import dayjs from "dayjs";
import { useState } from "react";
import { SHIFT_TYPES } from "../../data/constants";
import "./index.css";

const timeSlots = Array.from({ length: 26 }, (_, i) => {
  const hour = Math.floor(i / 2) + 8; // Start at 08:00
  const minutes = (i % 2) * 30; // Alternate between 0 and 30
  return `${hour.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:00`;
});

const CalendarView = ({ days, shifts, onShiftSelect }) => {
  const [scrollTop, setScrollTop] = useState(0);
  // only mon to sat
  days = days.slice(0, 6);

  const colors = {
    [SHIFT_TYPES.MY_SHIFTS]: "var(--green)",
    [SHIFT_TYPES.COVERAGE]: "var(--red)",
    [SHIFT_TYPES.MY_COVERAGE_REQUESTS]: "var(--yellow)",
    [SHIFT_TYPES.DEFAULT]: "var(--grey)",
  };

  const handleShiftSelection = (shift) => {
    onShiftSelect(shift);
  };

  return (
    <div 
      className="calendar-container"
      onScroll={(e) => setScrollTop(e?.target?.scrollTop)}
    >
      <table className="calendar-grid" cellSpacing="0" cellPadding="0">
        <colgroup>
          <col className="time-column"/>
          {Array.from({ length: 6 }).map((_, idx) => (
            <col key={idx} className="day-column" />
          ))}
        </colgroup>
        <thead
          className={scrollTop > 0 ? 'shadow' : ''}
        >
          <tr>
            <th className="time-header"></th>
            {days.map((day) => (
              <th className="day-header" key={day.dayOfMonthWithZero}>
                <div className="day-number" s>
                  {day.dayOfMonthWithZero}
                </div>
                <div className="day-name">{day.name}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeSlots.map((time) => (
            <tr key={time}>
              {/* Time column */}
              <td className="time-slot">
                {time.endsWith("00:00") && (
                  <span className="time-label-calendar">
                    {dayjs(time, "HH:mm:ss").format("h A")}
                  </span>
                )}
              </td>
              {/* Day columns */}
              {days.map((day) => (
                <td key={day.dayOfMonthWithZero + time} className="time-slot">
                  {shifts
                    .filter(
                      (shift) =>
                        shift.shift_date === dayjs(day.date).toISOString() &&
                        shift.start_time === time
                    )
                    .map((shift) => (
                      <div
                        key={shift.shift_id}
                        className="event"
                        onClick={() => handleShiftSelection(shift)}
                        style={{
                          zIndex: 1,
                          top: 0,
                          borderLeft: colors[shift.shift_type] + " 6px solid",
                          height:
                            dayjs(shift.end_time, "HH:mm:ss").diff(
                              dayjs(shift.start_time, "HH:mm:ss"),
                              "hour",
                              true
                            ) *
                              73 -
                            19 +
                            "px",
                        }}
                      >
                        <div className="event-title">{shift.class_name}</div>
                        <div className="event-time">
                          {dayjs(shift.start_time, "HH:mm:ss").format("h:mm A")}{" "}
                          - {dayjs(shift.end_time, "HH:mm:ss").format("h:mm A")}
                        </div>
                      </div>
                    ))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CalendarView;
