import dayjs from "dayjs";
import { useCallback, useEffect, useRef, useState } from "react";
import { useWeekView } from "react-weekview";
import { getVolunteerShiftsForMonth, getAllShiftsByMonth } from "../../api/shiftService";
import CalendarView from "../../components/CalendarView";
import DateToolbar from "../../components/DateToolbar";
import DetailsPanel from "../../components/DetailsPanel";
import ShiftCard from "../../components/ShiftCard";
import ShiftStatusToolbar from "../../components/ShiftStatusToolbar";
import { useAuth } from "../../contexts/authContext";
import { COVERAGE_STATUSES, SHIFT_TYPES, ADMIN_SHIFT_TYPES } from "../../data/constants";
import { getButtonConfig } from "../../utils/buttonConfig";
import "./index.css";

function Schedule() {
    const { user, isAdmin, isVolunteer} = useAuth();
    const currentDate = dayjs();
    const [selectedDate, setSelectedDate] = useState(dayjs());
    const [shifts, setShifts] = useState([]);
    const [filter, setFilter] = useState("all-shifts");
    const [selectedClassId, setSelectedClassId] = useState(null);
    const [selectedShiftButtons, setSelectedShiftButtons] = useState([]);
    const [selectedShiftDetails, setShiftDetails] = useState(null);
    const [viewMode, setViewMode] = useState("list");
    const { days, initialDate, nextWeek, previousWeek, goToToday } = useWeekView();

    // Create a ref object to store references to each shifts-container for scrolling
    const shiftRefs = useRef({});
    const scheduleContainerRef = useRef(null);

    const fetchShifts = useCallback(async () => {
        
        const body = {
            shiftDate: selectedDate.format("YYYY-MM-DD"),
        }
        const response = await getAllShiftsByMonth(body);
        

        // Filter out duplicated shifts and past coverage requests
        const shiftMap = new Map();
        response.forEach((shift) => {
            const existingShift = shiftMap.get(shift.shift_id);
            const shiftDay = dayjs(shift.shift_date).format("YYYY-MM-DD");
            const shiftEnd = dayjs(`${shiftDay} ${shift.end_time}`);
            const pastShift = currentDate.isAfter(shiftEnd);

            // Prioritize showing coverage shifts over my shifts
            if (existingShift && existingShift.shift_type === SHIFT_TYPES.MY_SHIFTS && shift.shift_type === SHIFT_TYPES.MY_COVERAGE_REQUESTS) {
                shiftMap.set(shift.shift_id, shift);

                // Don't show past shifts that are open for coverage
            } else if (shift.shift_type === SHIFT_TYPES.COVERAGE && pastShift) {
                // skip shift
            } else if (!existingShift) {
                shiftMap.set(shift.shift_id, shift);
            }
        });

        const uniqueShifts = Array.from(shiftMap.values());

        // Filter shifts based on selected filter type
        const filteredShifts = uniqueShifts.filter((shift) => {
            if (filter === "all-shifts") {
                return true; // No filtering for 'all-shifts'
            }
            return shift.coverage_status === filter;
        });
        setShifts(filteredShifts);
    }, [selectedDate, filter, user]); // Filters on user rather than their id

    // Fetch shifts for the selected date and filter
    useEffect(() => {
        const fetchData = async () => {
            await fetchShifts();
        };
        fetchData();
    }, [fetchShifts]);

    // map of shifts grouped by date { date: [shift1, shift2, ...] }
    const groupedShifts = shifts.reduce((acc, shift) => {
        const date = shift.shift_date;
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(shift);
        return acc;
    }, {});

    // Creates the buttons for the details panel based on the shift type
    const generateButtonsForDetailsPanel = (shift) => {
        const shiftDay = dayjs(shift.shift_date).format("YYYY-MM-DD");
        const shiftEnd = dayjs(`${shiftDay} ${shift.end_time}`);
        const pastShift = currentDate.isAfter(shiftEnd);

        const buttons = [];
        const buttonConfig = getButtonConfig(shift, handleShiftUpdate);
        
        const primaryButton = buttonConfig[shift.coverage_status] || buttonConfig[SHIFT_TYPES.DEFAULT]; // shift.coverage_status for admin shifts

        buttons.push(primaryButton);

        if (shift.coverage_status === ADMIN_SHIFT_TYPES.ADMIN_NEEDS_COVERAGE && !pastShift) {
          buttons.push(buttonConfig.CANCEL);
        } else if (shift.coverage_status === ADMIN_SHIFT_TYPES.ADMIN_PENDING_FULFILL) {
          buttons.push(buttonConfig.CANCEL);
        } else if (shift.coverage_status === ADMIN_SHIFT_TYPES.ADMIN_REQUESTED_COVERAGE) {
          buttons.push(buttonConfig.CANCEL);
        }

        return buttons;
    };

    // Update state when we update a shift
    const handleShiftUpdate = (updatedShift) => {
        setShifts((staleShifts) => {
            return staleShifts.map((shift) => {
                if (shift.shift_id === updatedShift.shift_id) {
                    return updatedShift;
                }
                return shift;
            });
        });

        // Triggers a re-render of the details panel
        handleShiftSelection(updatedShift);
    };

    // Update details panel when a shift is selected
    const handleShiftSelection = (classData) => {
        console.log("Selected shift: ", classData);
        setSelectedClassId(classData.class_id);

        setSelectedShiftButtons(generateButtonsForDetailsPanel(classData));
        console.log(selectedShiftButtons);
        setShiftDetails(classData);
    };

    const scrollToTop = useCallback(() => {
        const targetDate = selectedDate.format("YYYY-MM-DD");
        const scheduleContainer = scheduleContainerRef.current;
        const targetElement = shiftRefs.current[targetDate];

        if (scheduleContainer && targetElement) {
            // Calculate the offset of the target element within scheduleContainerRef
            const offsetTop = targetElement.offsetTop - scheduleContainer.offsetTop;
            scheduleContainer.scrollTo({
                top: offsetTop,
                behavior: "smooth",
            });
        }
    }, [selectedDate]); // Scroll to top when selectedDate changes

    useEffect(() => {
        scrollToTop();
    }, [scrollToTop, groupedShifts]);

    return (
        <main className="content-container">
            <div className="content-heading">
                <h2 className="content-title">Schedule</h2>
            </div>
            <div className="content-heading">
                <DateToolbar
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    nextWeek={nextWeek}
                    previousWeek={previousWeek}
                    goToToday={goToToday}
                />
            </div>
            <hr />
            <DetailsPanel classId={selectedClassId} classList={shifts} setClassId={setSelectedClassId} shiftDetails={selectedShiftDetails} dynamicShiftButtons={selectedShiftButtons}>
                <div className="schedule-page">
                    {viewMode === "list" ? (
                        <>
                            <ShiftStatusToolbar setFilter={setFilter} filter={filter} />
                            <hr />
                            <div ref={scheduleContainerRef} className="schedule-container">
                                {Object.keys(groupedShifts).length > 0 ? (
                                    Object.keys(groupedShifts).map((date) => (
                                        <div key={date} className="shifts-container" ref={(el) => (shiftRefs.current[dayjs(date).format("YYYY-MM-DD")] = el)}>
                                            {/* Date Header */}
                                            <h2 className={`date-header ${dayjs(date).isSame(selectedDate, "day") ? "selected-date" : "non-selected-date"}`}>
                                                {dayjs(date).format("ddd, D")}
                                                {dayjs(date).isSame(currentDate, "day") && " | Today"}
                                            </h2>

                                            {/* Shift List for this date */}
                                            <div className="shift-list">
                                                {groupedShifts[date].map((shift) => (
                                                    <ShiftCard
                                                        key={shift.fk_schedule_id}
                                                        shift={shift}
                                                        shiftType={shift.coverage_status}
                                                        onShiftSelect={handleShiftSelection}
                                                        buttonConfig={getButtonConfig(shift, handleShiftUpdate)}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p>No shifts to display for this month.</p>
                                )}
                            </div>
                        </>
                    ) : (
                        <CalendarView days={days} shifts={shifts} initialDate={initialDate} onShiftSelect={handleShiftSelection} />
                    )}
                </div>
            </DetailsPanel>
        </main>
    );
}

export default Schedule;
