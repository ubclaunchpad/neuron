import React, { useState, useEffect } from 'react';

const UserProfileForm = ({ volunteer_id }) => {
  const [userData, setUserData] = useState({
    email: "",
  });

  const [volunteerData, setVolunteerData] = useState({
    volunteer_id: "", // Primary key
    user_id: "", // Foreign key
    l_name: "",
    f_name: "",
    total_hours: "",
    class_preferences: "",
    bio: "",
    active: false,
  });

  // Fetch data on component mount
  useEffect(() => {
    const fetchVolunteerData = async () => {
      try {
        const response = await axios.get(`/api/volunteers/${volunteer_id}/user_email`);
        const data = response.data;
        setUserData({
          email: data.email,
        });
        setVolunteerData({
          volunteer_id: data.volunteer_id,
          l_name: data.l_name,
          f_name: data.f_name,
          total_hours: data.total_hours,
          class_preferences: data.class_preferences,
          bio: data.bio,
          active: data.active,
        });
      } catch (error) {
        console.error('Error fetching volunteer data:', error);
      }
    };

    fetchVolunteerData();
  }, [volunteer_id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setVolunteerData({
      ...volunteerData,
      [name]: value,
    });
  };

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await axios.put(`/api/volunteer/${volunteerData.volunteer_id}`, volunteerData);
      alert('Volunteer profile updated successfully');

      // Refetch the data to verify the update, for testing purposes
      const response = await axios.get(`/api/volunteers/${volunteer_id}/user_email`);
      const data = response.data;
      setUserData({
        email: data.email,
      });
      setVolunteerData({
        volunteer_id: data.volunteer_id,
        l_name: data.l_name,
        f_name: data.f_name,
        total_hours: data.total_hours,
        class_preferences: data.class_preferences,
        bio: data.bio,
        active: data.active,
      });
    } catch (error) {
      console.error('Error updating volunteer profile:', error);
      alert('Failed to update volunteer profile');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Email:</label>
        <input type="email" value={userData.email} readOnly />
      </div>
      <div>
        <label>First Name:</label>
        <input type="text" name="f_name" value={volunteerData.f_name} onChange={handleInputChange} />
      </div>
      <div>
        <label>Last Name:</label>
        <input type="text" name="l_name" value={volunteerData.l_name} onChange={handleInputChange} />
      </div>
      <div>
        <label>Total Hours:</label>
        <input type="number" name="total_hours" value={volunteerData.total_hours} onChange={handleInputChange} />
      </div>
      <div>
        <label>Class Preferences:</label>
        <input type="text" name="class_preferences" value={volunteerData.class_preferences} onChange={handleInputChange} />
      </div>
      <div>
        <label>Bio:</label>
        <textarea name="bio" value={volunteerData.bio} onChange={handleInputChange}></textarea>
      </div>
      <div>
        <label>Active:</label>
        <input type="checkbox" name="active" checked={volunteerData.active} onChange={(e) => setVolunteerData({ ...volunteerData, active: e.target.checked })} />
      </div>
      <button type="submit">Update Profile</button>
    </form>
  );
};

export default UserProfileForm;