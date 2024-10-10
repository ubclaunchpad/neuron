// This file groups all the API calls related to the neuron Classes page.
import api from './api';

const getAllClasses = () => api.get('/volunteer/classes')
    .then((response) => {
        console.log(response.data);
        return response.data;
    }).catch((error) => {
        console.error(error);
    });

export { getAllClasses };