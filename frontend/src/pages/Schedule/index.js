import dayjs from 'dayjs';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getVolunteerShiftsForMonth } from "../../api/shiftService";
import DateToolbar from "../../components/DateToolbar";
import DetailsPanel from "../../components/DetailsPanel";
import ShiftCard from "../../components/ShiftCard";
import ShiftStatusToolbar from "../../components/ShiftStatusToolbar";
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
            if (existingShift && existingShift.shift_type === 'my-shifts' && shift.shift_type === 'coverage') {
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

    // Re-fetch shifts when a shift is covered or updated
    const handleShiftUpdate = () => fetchShifts();

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
            </DetailsPanel>
        </main>
    );
}

export default VolunteerSchedule;