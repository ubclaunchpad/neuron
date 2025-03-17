import React, { useState } from "react";
import { formatImageUrl } from "../../api/imageService";
import Permission from "../../components/utils/Permission";
import AvailabilityGrid from "../../components/volunteerProfile/availabilityGrid";
import ClassPreferencesCardMP from "../../components/volunteerProfile/classPreferencesCard";
import VolunteerDetailsCard from "../../components/volunteerProfile/volunteerDetailsCard";
import { useAuth } from "../../contexts/authContext";
import "./index.css";

function Profile() {
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
        
        <Permission permissions="volunteer">
          <div className="content">
            <div className="column-1">
              <div className="volunteer-details-card">
                <VolunteerDetailsCard volunteer={{
                    ...user.volunteer,
                    profile_picture: formatImageUrl(user?.fk_image_id)
                  }} />
              </div>
              <div className="availability-card">
                <AvailabilityGrid
                  volunteerId={user?.volunteer?.volunteer_id}
                  availability={availability}
                  setAvailability={setAvailability}
                />
              </div>
            </div>
            <div className="column-2">
                <ClassPreferencesCardMP volunteer={user.volunteer} />
            </div>
          </div>
        </Permission>
      </main>
    );
}

export default Profile;
