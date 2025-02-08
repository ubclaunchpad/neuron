import React, { useState, useRef, useEffect } from 'react';
import dayjs from 'dayjs';
import { getAllSchedules } from '../../api/shiftService';
import DateToolbar from '../../components/DateToolbar';
import ShiftStatusToolbar from '../../components/ShiftStatusToolbar';
import ShiftCard from '../../components/ShiftCard';
import DetailsPanel from '../../components/DetailsPanel';

const AdminSchedule = () => {
    return (
        <div>
            <h1>Admin Schedule</h1>
        </div>
    )
}

export default AdminSchedule;