import axios from 'axios';
import { backend } from '../data/constants';

const api = axios.create({
    baseURL: backend
});

export default api;