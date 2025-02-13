// volunteer profile page
import React, { useState } from 'react';
import { formatImageUrl } from '../../api/imageService';
import AvailabilityGrid from "../../components/volunteerProfile/availabilityGrid";
import ChangePasswordCard from "../../components/volunteerProfile/changePasswordCard";
import VolunteerDetailsCard from "../../components/volunteerProfile/volunteerDetailsCard";
import { useAuth } from '../../contexts/authContext';
import "./index.css";

function VolunteerProfile() {
    const [availability, setAvailability] = useState([]);

    const { user, logout } = useAuth();

    return (
      <main className="content-container" style={{
        overflowY: "auto",
      }}>
        <div className="content-heading">
          <h2 className="content-title">My Profile</h2>
          <button className="logout-button" onClick={logout}>
            <i className="fa-solid fa-arrow-right-from-bracket"></i>&nbsp;&nbsp;Log Out
          </button>
        </div>
        { user?.volunteer ?
        <div className="content">
          <div className="column-1">
            <div className="volunteer-card">
              <VolunteerDetailsCard volunteer={{
                  ...user.volunteer,
                  profile_picture: formatImageUrl(user?.fk_image_id)
                }} />
            </div>
            <div className="availability-card">
              <AvailabilityGrid
                volunteerId={user.volunteer.volunteer_id}
                availability={availability}
                setAvailability={setAvailability}
              />
            </div>
          </div>
          <div className="column-2">
            <div className="password-card">
              <ChangePasswordCard volunteer={user.volunteer} />
            </div>
          </div>
        </div>
        : <></> 
        }
      </main>
    );
};

export default VolunteerProfile;
