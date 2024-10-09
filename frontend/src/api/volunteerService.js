// frontend/src/api/volunteerService.js

import api from './api';

export const fetchUserData = async (user_id) => {
  try {
    const response = await api.get(`/user/${user_id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
};

export const fetchVolunteerData = async (volunteer_id) => {
  try {
    const response = await api.get(`/volunteer/${volunteer_id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching volunteer data:', error);
    throw error;
  }
};

export const updateVolunteerData = async (volunteerData) => {
  try {
    const response = await api.put(`/volunteer/${volunteerData.volunteer_id}`, volunteerData);
    return response.data;
  } catch (error) {
    console.error('Error updating volunteer data:', error);
    throw error;
  }
};