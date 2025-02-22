import dayjs from "dayjs";
import "./index.css";
import { SHIFT_TYPES } from "../../data/constants";

const timeSlots = Array.from({ length: 26 }, (_, i) => {
    const hour = Math.floor(i / 2) + 8; // Start at 08:00
    const minutes = (i % 2) * 30; // Alternate between 0 and 30
    return `${hour.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:00`;
});

const CalendarView = ({ days, shifts, onShiftSelect }) => {
    // only keep mon-sat
    days = days.slice(0, 6);

    const colors = {
        [SHIFT_TYPES.MY_SHIFTS]: "var(--green)",
        [SHIFT_TYPES.COVERAGE]: "var(--red)",
        [SHIFT_TYPES.MY_COVERAGE_REQUESTS]: "var(--yellow)",
        [SHIFT_TYPES.DEFAULT]: "var(--grey)",
    };

    const handleShiftSelection = (event) => {
        onShiftSelect(event);
    };

    return (
        <div className="calendar-container">
            <div className="calendar-grid">
                <div className="grid-container">
                    {/* Time column */}
                    <div className="time-column">
                        <div className="day-header stick" />
                        {timeSlots.map((time) => (
                            <div key={time} className="time-slot">
                                {time.endsWith("00:00") && <span className="time-label-calendar">{dayjs(time, "HH:mm:ss").format("h A")}</span>}
                            </div>
                        ))}
                    </div>

                    {/* Days columns */}
                    {days.map((day) => (
                        <div key={day.dayOfMonthWithZero} className="day-column">
                            <div className="day-header stick">
                                <div className="day-number">{day.dayOfMonthWithZero}</div>
                                <div className="day-name">{day.name}</div>
                            </div>
                            {timeSlots.map((time) => (
                                <div key={time} className="time-slot">
                                    {shifts
                                        .filter((shift) => shift.shift_date === dayjs(day.date).toISOString() && shift.start_time === time)
                                        .map((shift) => (
                                            <div
                                                key={shift.shift_id}
                                                className="event"
                                                onClick={() => handleShiftSelection(shift)}
                                                style={{
                                                    zIndex: 1,
                                                    top: 0,
                                                    borderLeft: colors[shift.shift_type] + " 6px solid",
                                                    paddingBottom: dayjs(shift.end_time, "HH:mm:ss").diff(dayjs(shift.start_time, "HH:mm:ss"), "hour", true) - 0.5 + "vw",
                                                    height: dayjs(shift.end_time, "HH:mm:ss").diff(dayjs(shift.start_time, "HH:mm:ss"), "hour", true) * 8 + "vw",
                                                }}
                                            >
                                                <div className="event-title">{shift.class_name}</div>
                                                <div className="event-time">
                                                    {dayjs(shift.start_time, "HH:mm:ss").format("h:mm A")} - {dayjs(shift.end_time, "HH:mm:ss").format("h:mm A")}
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CalendarView;
