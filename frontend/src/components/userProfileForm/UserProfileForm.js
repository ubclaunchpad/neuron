import React, { useState, useEffect } from 'react';
import { fetchUserData, fetchVolunteerData, updateVolunteerData } from '../../api/volunteerService';

const UserProfileForm = ({ volunteer_id }) => {
  // const [userData, setUserData] = useState({
  //   user_id: "", // Primary key
  //   email: "",
  //   role: "", // VOLUN or ADMIN or INSTR
  //   password: "",
  //   created_at: "",
  // });

  const [volunteerData, setVolunteerData] = useState({
    volunteer_id: "", // Primary key
    user_id: "", // Foreign key
    l_name: "",
    f_name: "",
    total_hours: "",
    class_preferences: "",
    bio: "",
    active: false,
    email: ""
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // const fetchedUserData = await fetchUserData(user_id);
        // setUserData(fetchedUserData);

        const fetchedVolunteerData = await fetchVolunteerData(volunteer_id);
        setVolunteerData(fetchedVolunteerData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [volunteer_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setVolunteerData({
      ...volunteerData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedData = await updateVolunteerData(volunteerData);
      console.log('Success:', updatedData);

      // Optionally fetch the updated data again
      const refreshedData = await fetchVolunteerData(volunteer_id);
      setVolunteerData(refreshedData);
    } catch (error) {
      console.error('Error updating volunteer data:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* User Data (Read-Only) */}
      {/* <input
        type="text"
        name="email"
        value={userData.email}
        readOnly
        placeholder="Email"
      />
      <input
        type="text"
        name="role"
        value={userData.role}
        readOnly
        placeholder="Role"
      />
      <input
        type="password"
        name="password"
        value={userData.password}
        readOnly
        placeholder="Password"
      />
      <input
        type="text"
        name="created_at"
        value={userData.created_at}
        readOnly
        placeholder="Created At"
      /> */}
        <input
        type="text"
        name="email"
        value={volunteerData.email}
        readOnly
        placeholder="Email"
      />

      {/* Volunteer Data (Editable) */}
      <input
        type="text"
        name="f_name"
        value={volunteerData.f_name}
        onChange={handleChange}
        placeholder="First Name"
      />
      <input
        type="text"
        name="l_name"
        value={volunteerData.l_name}
        onChange={handleChange}
        placeholder="Last Name"
      />
      <input
        type="text"
        name="total_hours"
        value={volunteerData.total_hours}
        onChange={handleChange}
        placeholder="Total Hours"
      />
      <input
        type="text"
        name="class_preferences"
        value={volunteerData.class_preferences}
        onChange={handleChange}
        placeholder="Class Preferences"
      />
      <input
        type="text"
        name="bio"
        value={volunteerData.bio}
        onChange={handleChange}
        placeholder="Bio"
      />
      <label>
        Active:
        <input
          type="checkbox"
          name="active"
          checked={volunteerData.active}
          onChange={(e) => handleChange({ target: { name: 'active', value: e.target.checked } })}
        />
      </label>
      <button type="submit">Submit</button>
    </form>
  );
};

export default UserProfileForm;