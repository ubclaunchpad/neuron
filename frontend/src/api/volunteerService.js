import axios from 'axios';

export const getVolunteerShiftsForMonth = async (month) => {
  const response = await axios.get(`/volunteer/shifts/${month}`);
  return response.data;
};

export const fetchVolunteerData = async (volunteer_id) => {
  try {
    const response = await axios.get(`/volunteer/${volunteer_id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching volunteer data:', error);
    throw error;
  }
};

export const fetchUserData = async (user_id) => {
  try {
    const response = await axios.get(`/user/${user_id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching volunteer data:', error);
    throw error;
  }
};

export const updateVolunteerData = async (volunteerData, volunteer_id) => {
  try {
    const response = await axios.put(`/volunteer/${volunteer_id}`, volunteerData);
    return response.data;
  } catch (error) {
    console.error('Error updating volunteer data:', error);
    throw error;
  }
};

export const uploadProfilePicture = async (userId, profilePicData) => {
  try {
    const response = await axios.post(`/user/${userId}/upload`, profilePicData, {
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
    const response = await axios.get(`/volunteer/availability/${volunteer_id}`);
    return response.data; // Assuming API returns an array of time slots
  } catch (error) {
    console.error('Error fetching volunteer availability:', error);
    throw error;
  }
};

export const setVolunteerAvailability = async (volunteer_id, availability) => {
  try {
    const response = await axios.post(`/volunteer/availability/${volunteer_id}`, availability);
    return response.data; // Assuming API returns success or updated data
  } catch (error) {
    console.error('Error setting volunteer availability:', error);
    throw error;
  }
};

export const updateVolunteerAvailability = async (volunteer_id, availability) => {
  try {
    const response = await axios.put(`/volunteer/availability/${volunteer_id}`, availability);
    return response.data; // Assuming API returns success or updated data
  } catch (error) {
    console.error('Error updating volunteer availability:', error);
    throw error;
  }
};