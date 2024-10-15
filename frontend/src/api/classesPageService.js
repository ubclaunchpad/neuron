// This file groups all the API calls related to the neuron Classes page.
import api from './api';

const getAllClasses = () => api.get('/classes')
    .then((response) => {
        return response.data;
    }).catch((error) => {
        console.error(error);
    });

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

export { getAllClasses, getShiftInfo };