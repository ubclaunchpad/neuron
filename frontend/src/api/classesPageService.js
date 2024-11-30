// This file groups all the API calls related to the neuron Classes page.
import api from './api';

const getAllClasses = () => api.get('/classes')
    .then((response) => {
        return response.data;
    }).catch((error) => {
        console.error(error);
    });

const getClassById = (class_id) => api.get('/classes/' + class_id)
    .then((response) => {
        return response.data;
    }).catch((error) => {
        console.error(error);
    });

export { getAllClasses, getClassById };