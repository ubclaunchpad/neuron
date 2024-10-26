// volunteer profile page
import "./index.css";
import React from 'react'
import VolunteerLayout from "../../components/volunteerLayout";
import UserProfileForm from "../../components/userProfileForm/UserProfileForm";

function VolunteerProfile() {
    return (
        <VolunteerLayout  
            pageTitle="My Profile"  
            pageContent={
                <div className="volunteerProfile">
                    {/* hard coded volunteer ID until login is implemented */}
                    <UserProfileForm volunteer_id="1" />
                </div>
            }
        ></VolunteerLayout >
      );
};

export default VolunteerProfile;