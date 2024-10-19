// This file groups all the API calls related to the neuron Classes page.
import api from './api';

const getAllClasses = () => api.get('/classes')
    .then((response) => {
        return response.data;
    }).catch((error) => {
        console.error(error);
    });

export { getAllClasses };