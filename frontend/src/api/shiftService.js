// This file groups all the API calls related to getting shift information page.
import api from './api';

const getShiftInfo = async (volunteerID, scheduleID, shiftDate) => {
    try {
        const response = await api.post('/classes/shifts', { 
            volunteerID, 
            scheduleID, 
            shiftDate 
        });

        const res = response.data;
        return res;  
    } catch (error) {
        console.error('Error fetching shift info:', error);
        throw error;  
    }
}


// Retrieves all shifts for the volunteer monthly schedule view.
// The shift data includes the following shift_type values:
// -- 1. 'my-shifts' - shifts assigned to the volunteer.
// -- 2. 'coverage' - shifts available for coverage by other volunteers.
// -- 3. 'my-coverage-requests' - coverage requests made by the volunteer.
// -- Returns shift details such as date, time, class, duration, and coverage status.
const getVolunteerShiftsForMonth = async (body) => {
    try {
        const response = await api.post('/classes/shifts/volunteer-month', { 
            fk_volunteer_id: body.volunteer_id,
            shift_date: body.shiftDate 
        });

        return response.data;
    } catch (error) {
        console.error('Error fetching shift info:', error);
        throw error;  
    }
}

// Creates a request to cover a shift by a volunteer.
const requestToCoverShift = async (body) => {
    try {
        console.log('requestToCoverShift body:', body);
        const response = await api.post('/classes/shifts/request-to-cover-shift', { 
            request_id: body.request_id, 
            volunteer_id: body.volunteer_id
        });

        return response.data;
    } catch (error) {
        console.error('Error generating request to cover shift:', error);
        throw error;  
    }
}

export { getShiftInfo,
         getVolunteerShiftsForMonth,
         requestToCoverShift
        };