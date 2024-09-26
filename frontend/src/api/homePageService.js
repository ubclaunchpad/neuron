//homePageService.js
// This file groups all the API calls related to the neuron home page.
import api from './api';

const getHelloWorld = () => api.get('/')
    .then((response) => {
        console.log(response.data);
        return response.data;
    }).catch((error) => {
        console.error(error);
    });

export { getHelloWorld };