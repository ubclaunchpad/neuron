// volunteer profile page
import React, { useState } from 'react';
import { fetchVolunteerData, getProfilePicture } from "../../api/volunteerService";
import AvailabilityGrid from "../../components/volunteerProfile/availabilityGrid";
import ChangePasswordCard from "../../components/volunteerProfile/changePasswordCard";
import VolunteerDetailsCard from "../../components/volunteerProfile/volunteerDetailsCard";
import "./index.css";

function VolunteerProfile() {
    const [availability, setAvailability] = useState([]);
    const [volunteer, setVolunteer] = React.useState(null);

    React.useEffect(() => {
        async function fetch() {
            const volunteer_id = localStorage.getItem('volunteerID');
            try {
                const volunteerData = await fetchVolunteerData(volunteer_id);
                const profilePic = await getProfilePicture(volunteer_id);
                setVolunteer({ 
                    ...volunteerData, 
                    profile_picture: profilePic ? profilePic : null
                })
            } catch (error) {
                console.error(error);
            }
        }
        fetch();
    }, []);

    return (
      <main className="content-container" style={{
        overflowY: "auto",
      }}>
        <div className="content-heading">
          <h2 className="content-title">My Profile</h2>
          <button className="logout-button" onClick={() => {
                  localStorage.removeItem("neuronAuthToken");
                  window.location.href = "/auth/login";
              }}>
            <i className="fa-solid fa-arrow-right-from-bracket"></i>&nbsp;&nbsp;Log Out
          </button>
        </div>
        { volunteer ?
        <div className="content">
          <div className="column-1">
            <div className="volunteer-card">
              <VolunteerDetailsCard volunteer={volunteer} />
            </div>
            <div className="availability-card">
              <AvailabilityGrid
                volunteerId={volunteer.volunteer_id}
                availability={availability}
                setAvailability={setAvailability}
              />
            </div>
          </div>
          <div className="column-2">
            <div className="password-card">
              <ChangePasswordCard volunteer={volunteer} />
            </div>
          </div>
        </div>
        : <div>Loading...</div> 
        }
      </main>
    );
};

export default VolunteerProfile;
