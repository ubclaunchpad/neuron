// frontend/src/api/volunteerService.js

export const fetchUserData = async (user_id) => {
  try {
    const response = await fetch(`http://localhost:3001/api/sudo_get_USER?user_id=${user_id}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
};

export const fetchVolunteerData = async (user_id) => {
  try {
    const response = await fetch(`http://localhost:3001/api/sudo_get_VOLUN?user_id=${user_id}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching volunteer data:', error);
    throw error;
  }
};

export const updateVolunteerData = async (volunteerData) => {
  try {
    const response = await fetch('http://localhost:3001/api/sudo_put_VOLUN', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(volunteerData),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating volunteer data:', error);
    throw error;
  }
};