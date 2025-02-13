import { useEffect, useState } from "react";
import dayjs from "dayjs";
import "./index.css";
import CheckInIcon from '../../assets/check-in-icon.png'
import Plus from '../../assets/plus.png'
import RequestCoverageIcon from '../../assets/request-coverage.png'
import { requestToCoverShift } from '../../api/shiftService';
import { SHIFT_TYPES, COVERAGE_STATUSES } from '../../data/constants';

const timeSlots = Array.from({ length: 26 }, (_, i) => {
    const hour = Math.floor(i / 2) + 8; // Start at 08:00
    const minutes = (i % 2) * 30; // Alternate between 0 and 30
    return `${hour.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:00`;
});

const CalendarView = ({ days, shifts, onUpdate, onShiftSelect }) => {
    // only keep mon-sat
    days = days.slice(0, 6);
    const [shift, setShift] = useState({
        id: null,
        title: "",
        _class_id: null,
        checked_in: false,
        coverage_status: "",
        start_time: "",
        end_time: "",
        duration: 0,
        date: "",
        dayIndex: 0,
        type: SHIFT_TYPES.DEFAULT,
    });
    const [events, setEvents] = useState([]);
    const [pastShift, setPastShift] = useState(false);
    const volunteerID = localStorage.getItem('volunteerID');

    const colors = {
        [SHIFT_TYPES.MY_SHIFTS]: "var(--green)",
        [SHIFT_TYPES.COVERAGE]: "var(--red)",
        [SHIFT_TYPES.MY_COVERAGE_REQUESTS]: "var(--yellow)",
        [SHIFT_TYPES.DEFAULT]: "var(--grey)",
    };

    useEffect(() => {
         setPastShift(dayjs(shift.shift_date).format('YYYY-MM-DD') <= dayjs().format('YYYY-MM-DD'));
    }, [shift]);

    useEffect(() => {
        const events = shifts.map((shift, index) => {
            return {
                id: index,
                title: shift.class_name,
                _class_id: shift._class_id,
                checked_in: shift.checked_in,
                coverage_status: shift.coverage_status,
                start_time: shift.start_time,
                end_time: shift.end_time,
                duration: dayjs(shift.end_time, "HH:mm:ss").diff(dayjs(shift.start_time, "HH:mm:ss"), "hour", true),
                date: shift.shift_date,
                dayIndex: shift.day,
                type: shift.shift_type,
            };
        });
        setEvents(events);
    }, [shifts]);

    const handleCoverShiftClick = async () => {
        try {
            const body = {
                request_id: shift.request_id,
                volunteer_id: volunteerID,
            };
            await requestToCoverShift(body);
            // notify parent
            onUpdate();
        } catch (error) {
            console.error('Error generating request to cover shift:', error);
        }
    };

    // TODO Check-in handler for 'my-shifts'
    const handleCheckInClick = async () => {
        if (!shift.checked_in && pastShift) {
            // Perform check-in logic here
            console.log(`Checking in for shift ${shift.shift_id}`);
            // Set the state or make API call here to mark the shift as checked in
        }
    };

    // TODO
    const handleRequestCoverageClick = () => {
        console.log(`Requesting coverage for shift ${shift.shift_id}`);
        // Add logic for requesting coverage
    };

    const buttonConfig = {
            [SHIFT_TYPES.MY_SHIFTS]: {
                lineColor: 'var(--green)',
                label: shift.checked_in ? 'Checked In' : pastShift ? 'Check In' : 'Upcoming',
                icon: shift.checked_in ? null : pastShift ? CheckInIcon : null,
                disabled: shift.checked_in || !pastShift,
                buttonClass: shift.checked_in ? 'checked-in' : '',
                onClick: handleCheckInClick,
            },
            [SHIFT_TYPES.COVERAGE]: {
                lineColor: 'var(--red)',
                label: shift.coverage_status === COVERAGE_STATUSES.RESOLVED
                    ? 'Resolved'
                    : shift.coverage_status === COVERAGE_STATUSES.PENDING
                    ? 'Pending Approval'
                    : 'Cover',
                icon: shift.coverage_status === COVERAGE_STATUSES.OPEN ? Plus : null,
                disabled: shift.coverage_status === COVERAGE_STATUSES.RESOLVED || shift.coverage_status === COVERAGE_STATUSES.PENDING,
                onClick: handleCoverShiftClick,
            },
            [SHIFT_TYPES.MY_COVERAGE_REQUESTS]: {
                lineColor: 'var(--yellow)',
                label: 'Requested Coverage',
                icon: null,
                disabled: true,
                onClick: () => {}, // No action for this state
            },
            [SHIFT_TYPES.DEFAULT]: {
                lineColor: 'var(--grey)',
                label: 'View Details',
                icon: null,
                disabled: false,
            },
            REQUEST_COVERAGE: {
                lineColor: 'var(--yellow)',
                label: 'Request Coverage',
                icon: RequestCoverageIcon,
                disabled: false,
                onClick: handleRequestCoverageClick,
            },
        };

    const generateButtonsForDetailsPanel = (event) => {
        const buttons = [];
        const primaryButton = buttonConfig[event.type] || buttonConfig[SHIFT_TYPES.DEFAULT];

        buttons.push(primaryButton);
        if (event.type === SHIFT_TYPES.MY_SHIFTS) {
            buttons.push(buttonConfig.REQUEST_COVERAGE);
        }
        return buttons;
    };

    const handleShiftSelection = (event) => {
        console.log(event);
        setShift(event);
        const buttons = generateButtonsForDetailsPanel(event);
        onShiftSelect({ ...event, buttons });
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
                    {days.map((day, dayIndex) => (
                        <div key={day.dayOfMonthWithZero} className="day-column">
                            <div className="day-header stick">
                                <div className="day-number">{day.dayOfMonthWithZero}</div>
                                <div className="day-name">{day.name}</div>
                            </div>
                            {timeSlots.map((time) => (
                                <div key={time} className="time-slot">
                                    {events
                                        .filter((event) => event.date === dayjs(day.date).toISOString() && event.start_time === time)
                                        .map((event) => (
                                            <div
                                                key={event.id}
                                                className="event"
                                                onClick={() => handleShiftSelection(event)}
                                                style={{
                                                    zIndex: 1,
                                                    top: 0,
                                                    borderLeft: colors[event.type] + " 6px solid",
                                                    paddingBottom: event.duration - 0.5 + "vw",
                                                    height: event.duration * 8 + "vw",
                                                }}
                                            >
                                                <div className="event-title">{event.title}</div>
                                                <div className="event-time">
                                                    {dayjs(event.start_time, "HH:mm:ss").format("h:mm A")} - {dayjs(event.end_time, "HH:mm:ss").format("h:mm A")}
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
