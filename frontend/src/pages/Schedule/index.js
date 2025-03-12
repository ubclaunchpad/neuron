import dayjs from "dayjs";
import { useCallback, useEffect, useRef, useState } from "react";
import { useWeekView } from "react-weekview";
import { getShifts } from "../../api/shiftService";
import CalendarView from "../../components/CalendarView";
import DateToolbar from "../../components/DateToolbar";
import DetailsPanel from "../../components/DetailsPanel";
import ShiftCard from "../../components/ShiftCard";
import ShiftStatusToolbar from "../../components/ShiftStatusToolbar";
import { useAuth } from "../../contexts/authContext";
import { ADMIN_SHIFT_TYPES, COVERAGE_STATUSES, SHIFT_TYPES } from "../../data/constants";
import { getButtonConfig } from "../../utils/buttonConfig";
import "./index.css";
import { duration } from "@mui/material";

function Schedule() {
    const { user, isAdmin } = useAuth();
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
      const params = {
          // volunteer is passed in only for volunteers, not admins
          volunteer: isAdmin ? null : user?.volunteer?.volunteer_id,
          before: selectedDate.endOf('month').format("YYYY-MM-DD"),
          after: selectedDate.startOf('month').format("YYYY-MM-DD"),
        }
      
        let response;

        if (isAdmin) {
          response = await getShifts(params);
        } else {
          // For volunteers, fetch shifts associated to volunteer and open shifts for coverage
          const [myShifts, myCoverageShifts] = await Promise.all([
            getShifts({
              ...params,
            }),

            getShifts({
              ...params,
              type: 'coverage',
            })
          ])
          console.log(myCoverageShifts);
          response = [...myShifts, ...myCoverageShifts];
        }
        console.log(response);

      // Process shifts to determine shift_type based on absence_request ; case conditions for Admin accounts
      const processedShifts = response.map(shift => {
        let shift_type;
        let coverage_status;
        // COVERAGE_STATUSES.PENDING right now is for both pending coverage requests and absence requests – may need to fix
      
        if (!shift.absence_request || shift.absence_request.status === 'resolved') {
          // If the absence request is resolved or there is no absence request, shift is covered
          shift_type = isAdmin ? ADMIN_SHIFT_TYPES.ADMIN_COVERED : SHIFT_TYPES.MY_SHIFTS;
          // No coverage status for covered shifts
          coverage_status = null;
        } else if (shift.absence_request.status === 'absence-pending') {
          // The shift has an absence request, that is pending
          shift_type = isAdmin ? ADMIN_SHIFT_TYPES.ADMIN_REQUESTED_COVERAGE : SHIFT_TYPES.MY_COVERAGE_REQUESTS;
          coverage_status = COVERAGE_STATUSES.PENDING;
        } else if (shift.absence_request.status === 'absence-resolved') {
          // The shift has an absence request, seeing if it is pending or resolved
          shift_type = isAdmin ? ADMIN_SHIFT_TYPES.ADMIN_REQUESTED_COVERAGE : SHIFT_TYPES.MY_COVERAGE_REQUESTS;
          // Coverage status is resolved
          coverage_status = COVERAGE_STATUSES.RESOLVED;
        } else if (isAdmin && shift.absence_request.status === 'open' && shift.absence_request.covering_volunteer_id) {
          // A volunteer has offered to cover this shift 
          shift_type = ADMIN_SHIFT_TYPES.ADMIN_PENDING_FULFILL;
          coverage_status = null;
        } else if (shift.absence_request.status === 'open') {
          // Shift absence request is approved and is now open
          shift_type = isAdmin ? ADMIN_SHIFT_TYPES.ADMIN_NEEDS_COVERAGE : SHIFT_TYPES.COVERAGE;
          coverage_status = COVERAGE_STATUSES.OPEN
        }
        
      
        return { ...shift, shift_type, coverage_status };
      });
/* 
      if (isAdmin) {
        const adminShiftMap = new Map();
        processedShifts.forEach((shift) => {
          const shiftDay = dayjs(shift.shift_date).format("YYYY-MM-DD");
          const compositeKey = `${shift.class_id}-${shiftDay}-${shift.start_time}`;
          
          // Conditional to see if shift composite key is already in map
          if (!adminShiftMap.has(compositeKey)) {
            adminShiftMap.set(compositeKey, {
              class_id: shift.class_id,
              class_name: shift.class_name,
              shift_date: shift.shift_date,
              day: shift.day,
              start_time: shift.start_time,
              end_time: shift.end_time,
              duration: shift.duration,
              instructions: shift.instructions,
              zoom_link: shift.zoom_link,

              // Volunteer-specific information is aggregated
              volunteers: [{
                volunteer_id: shift.volunteer_id,
                shift_id: shift.shift_id,
                checked_in: shift.checked_in,
                absence_request: shift.absence_request
              }],

              shift_type: shift.shift_type
            });
          } else {
            // Add the volunteer to the existing shift composite key
            const existingGroup = groupedShifts.get(compositeKey);
            existingGroup.volunteers.push({
              volunteer_id: shift.volunteer_id,
              shift_id: shift.shift_id,
              checked_in: shift.checked_in,
              absence_request: shift.absence_request
            });

            if (shift.shift_type === ADMIN_SHIFT_TYPES.ADMIN_NEEDS_COVERAGE && 
              existingGroup.shift_type !== ADMIN_SHIFT_TYPES.ADMIN_NEEDS_COVERAGE) {
              existingGroup.shift_type = ADMIN_SHIFT_TYPES.ADMIN_NEEDS_COVERAGE;
            } else if (shift.shift_type === ADMIN_SHIFT_TYPES.ADMIN_REQUESTED_COVERAGE &&
              existingGroup.shift_type !== ADMIN_SHIFT_TYPES.ADMIN_NEEDS_COVERAGE) {
              existingGroup.shift_type = ADMIN_SHIFT_TYPES.ADMIN_REQUESTED_COVERAGE;
              }
          }
        })
 
      }
*/
        const shiftMap = new Map();

        processedShifts.forEach((shift) => {
          const shiftDay = dayjs(shift.shift_date).format("YYYY-MM-DD");
          const shiftEnd = dayjs(`${shiftDay} ${shift.end_time}`);
          const pastShift = currentDate.isAfter(shiftEnd);

          // Don't show past shifts that are open for coverage
          if (pastShift && shift.shift_type === (isAdmin ? ADMIN_SHIFT_TYPES.ADMIN_NEEDS_COVERAGE : SHIFT_TYPES.COVERAGE)) {
            // skip shift
            return
          }
          
          // Composite for admin -> class_id, with shift date and start time
          // Key for volunteer -> shift_id
          const key = isAdmin 
          ? `${shift.class_id}-${shiftDay}-${shift.start_time}`
          : shift.shift_id;

          // Conditional to see if key is already in map
          if (!shiftMap.has(key)) {

            if (isAdmin) {
              shiftMap.set(key, {
                class_id: shift.class_id,
                class_name: shift.class_name,
                shift_date: shift.shift_date,
                day: shift.day,
                start_time: shift.start_time,
                end_time: shift.end_time,
                duration: shift.duration,
                instructions: shift.instructions,
                zoom_link: shift.zoom_link,
  
                // Volunteer-specific information is aggregated
                volunteers: [{
                  volunteer_id: shift.volunteer_id,
                  shift_id: shift.shift_id,
                  checked_in: shift.checked_in,
                  absence_request: shift.absence_request
                }],
  
                shift_type: shift.shift_type

              })
            } else {
              // For volunteers, simply enter in shift information
              shiftMap.set(key, shift)
            }
          } else {
            const existingEntry = shiftMap.get(key)

            // For admins, push volunteer information into the existing shift information if it already exists
            if (isAdmin) {
              existingEntry.volunteers.push({
                volunteer_id: shift.volunteer_id,
                shift_id: shift.shift_id,
                checked_in: shift.checked_in,
                absence_request: shift.absence_request
              });

              // Shifts are updated based on priority: NEEDS_COVERAGE > REQUESTED_COVERAGE > COVERED
              if (shift.shift_type === ADMIN_SHIFT_TYPES.ADMIN_NEEDS_COVERAGE && 
                existingEntry.shift_type !== ADMIN_SHIFT_TYPES.ADMIN_NEEDS_COVERAGE) {
                existingEntry.shift_type = ADMIN_SHIFT_TYPES.ADMIN_NEEDS_COVERAGE;
              } else if (shift.shift_type === ADMIN_SHIFT_TYPES.ADMIN_REQUESTED_COVERAGE &&
                existingEntry.shift_type !== ADMIN_SHIFT_TYPES.ADMIN_NEEDS_COVERAGE) {
                existingEntry.shift_type = ADMIN_SHIFT_TYPES.ADMIN_REQUESTED_COVERAGE;
                }
            } else {
                // Prioritize showing coverage shifts over my shifts
              if (existingEntry && existingEntry.shift_type === SHIFT_TYPES.MY_SHIFTS && shift.shift_type === SHIFT_TYPES.MY_COVERAGE_REQUESTS) {
                shiftMap.set(shift.shift_id, shift);
               } else if (!existingEntry) {
                shiftMap.set(key, shift);
              }
            }
          }
      });

      const uniqueShifts = Array.from(shiftMap.values());

/*
        // Filter out duplicated shifts and past coverage requests
        const shiftMap = new Map();
        processedShifts.forEach((shift) => {
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
*/

        // Filter shifts based on selected filter type
        const filteredShifts = uniqueShifts.filter((shift) => {
            if (filter === "all-shifts") {
                return true; // No filtering for 'all-shifts'
            }
            return shift.shift_type === filter;
        });
        setShifts(filteredShifts);
    }, [selectedDate, filter, user]);

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
        const buttonConfig = getButtonConfig(shift, handleShiftUpdate, isAdmin? null : user?.volunteer.volunteer_id);
        const primaryButton = buttonConfig[shift.shift_type]

        if (primaryButton.label && !pastShift) {
          buttons.push(primaryButton);
          }

        if (isAdmin && !pastShift) {
          buttons.push(buttonConfig.CANCEL);
        }
        
        if (shift.shift_type === SHIFT_TYPES.MY_SHIFTS && !shift.checked_in && !pastShift) {
          buttons.push(buttonConfig.REQUEST_COVERAGE);
      } else if (shift.shift_type === SHIFT_TYPES.COVERAGE && shift.coverage_status === COVERAGE_STATUSES.PENDING) {
          buttons.push(buttonConfig.CANCEL);
      } else if (shift.shift_type === SHIFT_TYPES.MY_COVERAGE_REQUESTS && shift.coverage_status === COVERAGE_STATUSES.OPEN) {
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
        console.log( "HELLO", classData.shift_details);
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
            <DetailsPanel classId={selectedClassId} classList={shifts} setClassId={setSelectedClassId} shiftDetails={selectedShiftDetails} dynamicShiftButtons={selectedShiftButtons} type='schedule'>
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
                                                        shiftType={shift.shift_type}
                                                        onShiftSelect={handleShiftSelection}
                                                        // getButtonConfig sets volunteerID to null for Admin accounts
                                                        buttonConfig={getButtonConfig(shift, handleShiftUpdate, isAdmin ? null : user?.volunteer.volunteer_id)}
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