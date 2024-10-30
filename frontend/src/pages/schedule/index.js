// VolunteerSchedule.js
import "./index.css";
import React, { useState, useEffect } from 'react';
import VolunteerLayout from "../../components/volunteerLayout";
import dayjs from 'dayjs';
import DateToolbar from "../../components/dateToolbar";
import { getShiftOnDate } from "../../api/shiftService";
import ShiftCard from "../../components/shiftCard";

function VolunteerSchedule() {
    const currentDate = dayjs();
    const [selectedDate, setSelectedDate] = useState(dayjs());
    const [shifts, setShifts] = useState([]);

    // Fetch shifts for the selected date
    useEffect(() => {
        const fetchShifts = async () => {
            const formattedDate = selectedDate.format('YYYY-MM-DD');
            const response = await getShiftOnDate(formattedDate);
            setShifts(response);
        };
        fetchShifts();
    }, [selectedDate]);

    return (
        <VolunteerLayout
            pageTitle="Schedule"
            pageContent={
                <body>
                    <DateToolbar selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
                    <hr></hr>
                    <div className="schedule-container">
                        
                        {/* Date Header */}
                        <div className="shifts-container">
                            <h2 className="date-header">
                                {selectedDate.format('ddd, D')} 
                                {selectedDate.isSame(currentDate, 'day') && ' | Today'}
                            </h2>

                            {/* Shift List */}
                            <div className="shift-list">
                                {shifts.length > 0 ? (
                                    shifts.map((shift) => (
                                        <ShiftCard key={shift.fk_schedule_id} shift={shift} />
                                    ))
                                ) : (
                                    <p>No shifts available for this date.</p>
                                )}
                            </div> 
                        </div>

                    </div>
                </body>
            }
        />
    );
}

export default VolunteerSchedule;