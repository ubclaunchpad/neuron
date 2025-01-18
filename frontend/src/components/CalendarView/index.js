import { useWeekView } from "react-weekview";
import { isBefore, startOfWeek } from "date-fns";
import { useState } from "react";
import "./index.css";

const timeSlots = Array.from({ length: 10 }, (_, i) => {
    const hour = i + 8;
    return `${hour === 12 ? 12 : hour % 12} ${hour < 12 ? "AM" : "PM"}`;
});

const events = [
    {
        id: "1",
        title: "Higher Intensity Interval Training",
        startTime: "10 AM",
        endTime: "11 AM",
        type: "interval",
        dayIndex: 4, // Friday
        startHour: 10,
    },
    {
        id: "2",
        title: "Higher Intensity Chair Exercise",
        startTime: "11 AM",
        endTime: "12 PM",
        type: "chair",
        dayIndex: 4, // Friday
        startHour: 11,
    },
];

const CalendarView = () => {
    let { days, nextWeek, previousWeek, goToToday, viewTitle } = useWeekView();

    days = days.splice(0, 6); // Only show weekdays

    return (
        <div className="calendar-container">
            <div className="calendar-nav"></div>

            <div className="calendar-grid">
                <div className="grid-container">
                    {/* Time column */}
                    <div className="time-column">
                        <div className="day-header" />
                        {timeSlots.map((time) => (
                            <div key={time} className="time-slot">
                                <span className="time-label-calendar">{time}</span>
                            </div>
                        ))}
                    </div>

                    {/* Days columns */}
                    {days.map((day, dayIndex) => (
                        <div key={day.number} className="day-column">
                            <div className="day-header">
                                <div className="day-number">{day.dayOfMonthWithZero}</div>
                                <div className="day-name">{day.name}</div>
                            </div>
                            {timeSlots.map((time) => (
                                <div key={time} className="time-slot">
                                    {events
                                        .filter((event) => event.dayIndex === dayIndex && event.startTime === time)
                                        .map((event) => (
                                            <div
                                                key={event.id}
                                                className={`event ${event.type === "interval" ? "event-interval" : "event-chair"}`}
                                                style={{
                                                    top: "4px",
                                                    height: "calc(100% - 8px)",
                                                }}
                                            >
                                                <div className="event-title">{event.title}</div>
                                                <div className="event-time">
                                                    {event.startTime} - {event.endTime}
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
