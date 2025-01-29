import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getVolunteerShiftsForMonth } from "../../api/shiftService";
import { requestToCoverShift, checkInShift } from '../../api/shiftService';
import { SHIFT_TYPES, COVERAGE_STATUSES } from '../../data/constants';
import DateToolbar from "../../components/DateToolbar";
import DetailsPanel from "../../components/DetailsPanel";
import ShiftCard from "../../components/ShiftCard";
import ShiftStatusToolbar from "../../components/ShiftStatusToolbar";
import CheckInIcon from '../../assets/check-in-icon.png'
import Plus from '../../assets/plus.png'
import RequestCoverageIcon from '../../assets/request-coverage.png'
import "./index.css";

function VolunteerSchedule() {
    const volunteerID = localStorage.getItem('volunteerID');
    const currentDate = dayjs();
    const [selectedDate, setSelectedDate] = useState(dayjs());
    const [shifts, setShifts] = useState([]);
    const [filter, setFilter] = useState('all-shifts');
    const [selectedClassId, setSelectedClassId] = useState(null);
    const [selectedShiftButtons, setSelectedShiftButtons] = useState([]);
    const [selectedShiftDetails, setShiftDetails] = useState(null);

    // Create a ref object to store references to each shifts-container for scrolling
    const shiftRefs = useRef({});
    const scheduleContainerRef = useRef(null); 

    const fetchShifts = useCallback(async () => {
        const body = {
            volunteer_id: volunteerID,
            shiftDate: selectedDate.format('YYYY-MM-DD')
        };
        const response = await getVolunteerShiftsForMonth(body);
        
        // Filter out duplicate shifts
        const shiftMap = new Map();
        response.forEach((shift) => {
            const existingShift = shiftMap.get(shift.shift_id);

            // Prioritize showing coverage shifts over my shifts
            if (existingShift && existingShift.shift_type === 'my-shifts' && shift.shift_type === 'my-coverage-requests') {
                shiftMap.set(shift.shift_id, shift);
            } else if (!existingShift) {
                shiftMap.set(shift.shift_id, shift);
            }
        });

        const uniqueShifts = Array.from(shiftMap.values());
        
        // Filter shifts based on selected filter type
        const filteredShifts = uniqueShifts.filter((shift) => {

            if (filter === 'all-shifts') {
                return true; // No filtering for 'all-shifts'
            }
            return shift.shift_type === filter;
        });
        setShifts(filteredShifts);
        
    }, [selectedDate, filter, volunteerID]);

    // Fetch shifts for the selected date and filter
    useEffect(() => {
        const fetchData = async () => {
            await fetchShifts();
        }
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

    const handleCoverShiftClick = async (shift) => {
        try {
            const body = {
                request_id: shift.request_id,
                volunteer_id: volunteerID,
            };
            console.log(`Requesting to cover shift ${shift.shift_id}`);
            await requestToCoverShift(body);
            // notify parent

            // TODO: Need to update this with the new onUpdate()!!!
            handleShiftUpdate({ ...shift });
        } catch (error) {
            console.error('Error generating request to cover shift:', error);
        }
    };

    const handleCheckInClick = async (shift) => {
        try {
            if (!shift.checked_in) {
                console.log(`Checking in for shift ${shift.shift_id}`);
                await checkInShift(shift.shift_id);
                handleShiftUpdate({ ...shift, checked_in: 1 });
            } 
        } catch (error) {
            console.error('Error checking in for shift:', error);
        }
    };

    // TODO: Implement this function
    const handleRequestCoverageClick = (shift) => {
        console.log(`Requesting coverage for shift ${shift.shift_id}`);
        // Add logic for requesting coverage
    };

    // Returns the button configuration for the shift based on the shift type
    const getButtonConfig = (shift) => {

        const shiftDay = dayjs(shift.shift_date).format('YYYY-MM-DD');
        const shiftStart = dayjs(`${shiftDay} ${shift.start_time}`);
        const shiftEnd = dayjs(`${shiftDay} ${shift.end_time}`);
    
        const pastShift = currentDate.isAfter(shiftEnd);
        const currentShift = currentDate.isBetween(shiftStart, shiftEnd, 'minute', '[]');

        return {
            [SHIFT_TYPES.MY_SHIFTS]: {
                lineColor: 'var(--green)',
                label: shift.checked_in 
                    ? 'Checked In' 
                        : currentShift 
                        ? 'Check In' 
                            : pastShift
                            ? 'Missed Shift'
                                : 'Upcoming',
                icon: shift.checked_in ? null : currentShift ? CheckInIcon : null,
                disabled: shift.checked_in || !currentShift,
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
    }


    // Creates the buttons for the details panel based on the shift type
    const generateButtonsForDetailsPanel = (shift) => {

        const shiftDay = dayjs(shift.shift_date).format('YYYY-MM-DD');
        const shiftEnd = dayjs(`${shiftDay} ${shift.end_time}`);
        const pastShift = currentDate.isAfter(shiftEnd);

        const buttons = [];
        const buttonConfig = getButtonConfig(shift);
        const primaryButton = buttonConfig[shift.shift_type] || buttonConfig[SHIFT_TYPES.DEFAULT];

        buttons.push(primaryButton);
        if (shift.shiftType === SHIFT_TYPES.MY_SHIFTS && !shift.checked_in && !pastShift) {
            buttons.push(buttonConfig.REQUEST_COVERAGE);
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
            })
        })

        if (selectedShiftDetails && selectedShiftDetails.shift_id === updatedShift.shift_id) {
            setShiftDetails(updatedShift);
            setSelectedShiftButtons(generateButtonsForDetailsPanel(updatedShift));
        }
    };

    // Update details for the side panel when a shift is selected or updated
    const handleShiftSelection = (classData) => {
        setSelectedClassId(classData._class_id);
        setSelectedShiftButtons(generateButtonsForDetailsPanel(classData));
        setShiftDetails(classData);
    };

    const scrollToTop = useCallback(() => {
        const targetDate = selectedDate.format('YYYY-MM-DD');
        const scheduleContainer = scheduleContainerRef.current;
        const targetElement = shiftRefs.current[targetDate];
    
        if (scheduleContainer && targetElement) {
            // Calculate the offset of the target element within scheduleContainerRef
            const offsetTop = targetElement.offsetTop - scheduleContainer.offsetTop;
            scheduleContainer.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
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
            <DetailsPanel
                classId={selectedClassId}
                classList={shifts}
                setClassId={setSelectedClassId}
                shiftDetails={selectedShiftDetails}
                dynamicShiftbuttons={selectedShiftButtons}>
                <div className="schedule-page">
                    <DateToolbar selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
                    <hr />
                    <ShiftStatusToolbar setFilter={setFilter} filter={filter} />
                    <hr />  
                    <div ref={scheduleContainerRef} className="schedule-container">
                        {Object.keys(groupedShifts).length > 0 ? (
                            Object.keys(groupedShifts).map((date) => (
                              <div 
                                key={date} 
                                className="shifts-container"
                                ref={(el) => shiftRefs.current[dayjs(date).format('YYYY-MM-DD')] = el}  
                            >
                                {/* Date Header */}
                                <h2
                                    className={`date-header ${dayjs(date).isSame(selectedDate, 'day') ? 'selected-date' : 'non-selected-date'}`}
                                >
                                    {dayjs(date).format('ddd, D')}
                                    {dayjs(date).isSame(currentDate, 'day') && ' | Today'}
                                </h2>

                                {/* Shift List for this date */}
                                <div className="shift-list">
                                    {groupedShifts[date].map((shift) => (
                                        <ShiftCard 
                                            key={shift.fk_schedule_id} 
                                            shift={shift} 
                                            shiftType={shift.shift_type} 
                                            onShiftSelect={handleShiftSelection}
                                            buttonConfig={getButtonConfig(shift)}
                                        />
                                    ))}
                                </div> 
                              </div>
                            ))
                        ) : (
                            <p>No shifts to display for this month.</p>
                        )}
                    </div>
                </div>
            </DetailsPanel>
        </main>
    );
}

export default VolunteerSchedule;