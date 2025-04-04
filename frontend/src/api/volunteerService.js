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

export const fetchUserData = async (user_id) => {
  try {
    const response = await api.get(`/user/${user_id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching volunteer data:', error);
    throw error;
  }
};

export const updateVolunteerData = async (volunteerData, volunteer_id) => {
  try {
    const response = await api.put(`/volunteer/${volunteer_id}`, volunteerData);
    return response.data;
  } catch (error) {
    console.error('Error updating volunteer data:', error);
    throw error;
  }
};

export const uploadProfilePicture = async (userId, profilePicData) => {
  try {
    const response = await api.post(`/user/${userId}/upload`, profilePicData, {
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

export const fetchUserPreferredClasses = async (volunteer_id) => {
  try {
    const response = await api.get(`/volunteer/class-preferences/${volunteer_id}`);
    return response.data; // Assuming API returns success or updated data
  } catch (error) {
    console.error('Error fetching volunteer class preferences data:', error);
    throw error;
  }
};

export const fetchAllClassPreferences = async () => {
  try {
    const response = await api.get(`/volunteer/class-preferences/`);
    return response.data; // Assuming API returns success or updated data
  } catch (error) {
    console.error('Error fetching all class preferences data:', error);
    throw error;
  }
};

export const updateUserPreferredClasses = async (volunteer_id, preferredClasses) => {
  try {
    const response = await api.put(`/volunteer/class-preferences/${volunteer_id}`, preferredClasses);
    return response.data; // Assuming API returns success or updated data
  } catch (error) {
    console.error('Error updating volunteer class preferences data:', error);
    throw error;
  }
};

export const updatVolunteerEmail = async (volunteer_id, email) => {
  try {
    const response = await api.put(`/volunteer/email-update/${volunteer_id}`, email);
    return response.data; // Assuming API returns success or updated data
  } catch (error) {
    console.error('Error updating volunteer class preferences data:', error);
    throw error;
  }
};

export const getVolunteers = (params) => 
  api
      .get('volunteer', {
        params: params ?? {}
      })
      .then((response) => response.data)
      .catch((error) => {
          console.error(error);
      });

export const verifyVolunteer = (volunteerId, signoff) => {
  api
      .patch(`/volunteer/${volunteerId}/verify`, { signoff })
      .then((response) => response.data)
      .catch((error) => {
          console.error(error);
      });
    }

export const deactivateVolunteer = (volunteerId, signoff) => 
  api
      .patch(`/volunteer/${volunteerId}/deactivate`, { signoff })
      .then((response) => response.data)
      .catch((error) => {
          console.error(error);
      });

export const denyVolunteer = (volunteerId, signoff) => 
  api
      .patch(`/volunteer/${volunteerId}/deny`, { signoff })
      .then((response) => response.data)
      .catch((error) => {
          console.error(error);
      });