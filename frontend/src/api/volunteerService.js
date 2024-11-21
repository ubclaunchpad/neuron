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

export const fetchVolunteerAvailability = async (volunteer_id) => {
  try {
    const response = await api.get(`/availability/${volunteer_id}`);
    return response.data; // Assuming API returns an array of time slots
  } catch (error) {
    console.error('Error fetching volunteer availability:', error);
    throw error;
  }
};

export const updateVolunteerAvailability = async (volunteer_id, availability) => {
  try {
    const response = await api.put(`/availability/${volunteer_id}`, { availability });
    return response.data; // Assuming API returns success or updated data
  } catch (error) {
    console.error('Error updating volunteer availability:', error);
    throw error;
  }
};