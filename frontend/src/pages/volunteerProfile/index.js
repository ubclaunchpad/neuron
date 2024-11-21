// volunteer profile page
import "./index.css";
import React, { useState } from 'react';
import VolunteerLayout from "../../components/volunteerLayout";
import UserProfileForm from "../../components/userProfileForm/UserProfileForm";
import AvailabilityGrid from "../../components/availabilityGrid/AvailabilityGrid";

function VolunteerProfile() {
    const [availability, setAvailability] = useState([]);

    return (
        <VolunteerLayout  
            pageTitle="My Profile"  
            pageContent={
                <div className="volunteerProfile" style={{ display: 'flex', gap: '20px' }}>
                    {/* Hard-coded volunteer ID until login is implemented */}
                    <div style={{ flex: '1' }}>
                        <UserProfileForm volunteer_id="1" />
                    </div>

                    <div style={{ flex: '1' }}>
                        <h3>Set Your Availability</h3>
                        <AvailabilityGrid availability={availability} setAvailability={setAvailability} />
                    </div>
                </div>
            }
        />
    );
};

export default VolunteerProfile;
