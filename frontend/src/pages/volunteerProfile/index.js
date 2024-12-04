// volunteer profile page
import "./index.css";
import React, { useState } from 'react';
import VolunteerLayout from "../../components/volunteerLayout";
import { fetchVolunteerData, getProfilePicture } from "../../api/volunteerService";
import VolunteerDetailsCard from "../../components/volunteerProfile/volunteerDetailsCard";
import ChangePasswordCard from "../../components/volunteerProfile/changePasswordCard";
import AvailabilityGrid from "../../components/volunteerProfile/availabilityGrid";

const pageTitle = "My Profile";

function VolunteerProfile() {
    const [availability, setAvailability] = useState([]);
    const [volunteer, setVolunteer] = React.useState(null);

    React.useEffect(() => {
        async function fetch() {
            // hardcoded id until auth is finished
            const volunteer_id = "1230545b-0505-4909-826c-59359503dae6";
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
        volunteer ? (
            <div className="volunteerProfile">
                <VolunteerLayout 
                pageTitle={pageTitle}
                pageContent={
                    <div className="content">
                        <div className="column-1">
                            <div className="volunteer-card">
                                <VolunteerDetailsCard volunteer={volunteer} />
                            </div>    
                            <div className="availability-card">
                                <AvailabilityGrid volunteerId={volunteer.volunteer_id} availability={availability} setAvailability={setAvailability} />
                            </div>
                        </div>
                        <div className="column-2">
                            <div className="password-card">
                                <ChangePasswordCard volunteer={volunteer} />
                            </div>
                        </div>
                    </div>
                }/>
            </div>
        ) : <></>
      );
};

export default VolunteerProfile;
