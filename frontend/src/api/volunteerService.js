import { backend } from '../data/constants';
import api from './api';

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

export const insertProfilePicture = async (profilePicData) => {
  try {
    const response = await api.post(`/volunteer/profile-picture`, profilePicData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  } catch (error) {
    console.error('Error updating profile picture:', error);
    throw error;
  }
}

export const getProfilePicture = async (volunteer_id) => {
  return `${backend}/volunteer/profile-picture/${volunteer_id}`
}

export const updateProfilePicture = async (volunteer_id, profilePicData) => {
  try {
    const response = await api.put(`/volunteer/profile-picture/${volunteer_id}`, profilePicData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  } catch (error) {
    console.error('Error updating profile picture:', error);
    throw error;
  }
}

export const fetchVolunteerAvailability = async (volunteer_id) => {
  try {
    const response = await api.get(`/volunteer/availability/${volunteer_id}`);
    return response.data; // Assuming API returns an array of time slots
  } catch (error) {
    console.error('Error fetching volunteer availability:', error);
    throw error;
  }
};

export const setVolunteerAvailability = async (volunteer_id, availability) => {
  try {
    const response = await api.post(`/volunteer/availability/${volunteer_id}`, availability);
    return response.data; // Assuming API returns success or updated data
  } catch (error) {
    console.error('Error setting volunteer availability:', error);
    throw error;
  }
};

export const updateVolunteerAvailability = async (volunteer_id, availability) => {
  try {
    const response = await api.put(`/volunteer/availability/${volunteer_id}`, availability);
    return response.data; // Assuming API returns success or updated data
  } catch (error) {
    console.error('Error updating volunteer availability:', error);
    throw error;
  }
};