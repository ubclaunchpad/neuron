//authService.js
// This file groups all the API calls related to the neuron login/signup page.
import api from './api';

const signup = async (payload) => {
    try {
        console.log(payload)
        console.log(api.baseURL)
        const response = await api.post('/signup', payload);

        return response; 
    } catch (error) {
        console.error('Signup Error:', error);
        throw error; 
    }
};

const login = async (payload) => {
    try {
        console.log(payload)
        console.log(api.baseURL)
        const response = await api.post('/login', payload);

        return response; 
    } catch (error) {
        console.error('Login Error:', error);
        throw error; 
    }
};


export { signup, login };

