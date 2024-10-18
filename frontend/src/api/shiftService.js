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

export { getShiftInfo };