// volunteer profile page
import "./index.css";
import React from 'react'
import Header from '../../components/header';
import UserProfileForm from "../../components/userProfileForm/UserProfileForm";

function VolunteerProfile() {
    return (
        <div className="volunteerProfile">
            <Header />
            {/* hard coded volunteer ID until login is implemented */}
            <UserProfileForm volunteer_id="1" />
        </div>
      );
};

export default VolunteerProfile;