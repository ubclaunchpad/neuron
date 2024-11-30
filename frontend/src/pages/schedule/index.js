import "./index.css";
import { useState, useEffect, useRef, useCallback } from 'react';
import VolunteerLayout from "../../components/volunteerLayout";
import dayjs from 'dayjs';
import DateToolbar from "../../components/DateToolbar";
import ShiftCard from "../../components/ShiftCard";
import ShiftStatusToolbar from "../../components/ShiftStatusToolbar";
import { getVolunteerShiftsForMonth } from "../../api/shiftService";
import ClassPanel from "../../components/classPanel";

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

    // Fetch shifts for the selected date and filter
    useEffect(() => {
        const fetchShifts = async () => {
            const body = {
                volunteer_id: volunteerID,
                shiftDate: selectedDate.format('YYYY-MM-DD')
            };
            const response = await getVolunteerShiftsForMonth(body);
            
            // Filter shifts based on selected filter type
            const filteredShifts = response.filter((shift) => {
                if (filter === 'all-shifts') {
                    return true; // No filtering for 'all-shifts'
                }
                return shift.shift_type === filter;
            });
            setShifts(filteredShifts);
        };
        fetchShifts();
    }, [selectedDate, filter, volunteerID]);

    // map of shifts grouped by date { date: [shift1, shift2, ...] }
    const groupedShifts = shifts.reduce((acc, shift) => {
        const date = shift.shift_date; 
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(shift);
        return acc;
    }, {});

    // Re-fetch shifts when a shift is covered or updated
    const handleShiftUpdate = () => {
        const fetchShifts = async () => {
            const body = {
                volunteer_id: volunteerID,
                shiftDate: selectedDate.format('YYYY-MM-DD')
            };
            const response = await getVolunteerShiftsForMonth(body);
            const filteredShifts = response.filter((shift) => {
                if (filter === 'all-shifts') {
                    return true;
                }
                return shift.shift_type === filter;
            });
            setShifts(filteredShifts);
        };
        fetchShifts();
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

    // side panel shift details
    const handleShiftSelection = (classData) => {
        setSelectedClassId(classData._class_id);
        setSelectedShiftButtons(classData.buttons);
        setShiftDetails(classData);
    };

    return (
        <VolunteerLayout
            pageTitle="Schedule"
            pageContent={
                <ClassPanel
                    classId={selectedClassId}
                    classList={shifts}
                    setClassId={setSelectedClassId}
                    shiftDetails={selectedShiftDetails}
                    dynamicShiftbuttons={selectedShiftButtons}
                    pageContent={
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
                                                        onUpdate={handleShiftUpdate} 
                                                        onShiftSelect={handleShiftSelection}
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
                    }>
                </ClassPanel>
            }
        />
    );
}

export default VolunteerSchedule;