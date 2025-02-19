import React, { useState, useEffect, useCallback, useRef } from 'react';
import dayjs from 'dayjs';
import { getAllShiftsByMonth } from '../../api/shiftService';
import DateToolbar from '../../components/DateToolbar';
import DetailsPanel from '../../components/DetailsPanel';
import ShiftCard from '../../components/ShiftCard';
import ShiftStatusToolbar from '../../components/ShiftStatusToolbar';
import './index.css';

function AdminSchedule() {
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
    const month = selectedDate.month() + 1;
    const year = selectedDate.year();
    const response = await getAllShiftsByMonth(month, year);

    // Process shifts
    const shiftMap = new Map();
    response.forEach((shift) => {
      const shiftDay = dayjs(shift.shift_date).format('YYYY-MM-DD');
      const shiftEnd = dayjs(`${shiftDay} ${shift.end_time}`);
      const pastShift = currentDate.isAfter(shiftEnd);

      if (!pastShift) {
        shiftMap.set(shift.shift_id, shift);
      }
    });

    setShifts(Array.from(shiftMap.values()));
  }, [selectedDate]);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  return (
    <div className="schedule-page">
      <DateToolbar selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
      <ShiftStatusToolbar setFilter={setFilter} filter={filter} />
      <div ref={scheduleContainerRef} className="schedule-container">
        {shifts.map((shift) => (
          <ShiftCard
            key={shift.shift_id}
            shift={shift}
            shiftType={shift.coverage_status}
            onUpdate={() => {}}
            onShiftSelect={() => {}}
          />
        ))}
      </div>
      <DetailsPanel
        classId={selectedClassId}
        classList={shifts}
        setClassId={setSelectedClassId}
        shiftDetails={selectedShiftDetails}
        dynamicShiftbuttons={selectedShiftButtons}
      />
    </div>
  );
}

export default AdminSchedule;