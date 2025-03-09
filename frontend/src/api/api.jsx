import axios from 'axios';
import { backend } from '../data/constants';

const api = axios.create({
    baseURL: backend
});

// Attach auth token to each req
api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('neuronAuthToken');

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
);

export default api;