// volunteer profile page
import "./index.css";
import React, { useState } from 'react';
import VolunteerLayout from "../../components/volunteerLayout";
import { fetchVolunteerData } from "../../api/volunteerService";
import VolunteerDetailsCard from "../../components/volunteerProfile/volunteerDetailsCard";
import ChangePasswordCard from "../../components/volunteerProfile/changePasswordCard";
import ClassPreferencesCard from "../../components/volunteerProfile/classPreferencesCard";
// import UserProfileForm from "../../components/userProfileForm/UserProfileForm";
import AvailabilityGrid from "../../components/volunteerProfile/availabilityGrid";

const pageTitle = "My Profile";

function VolunteerProfile() {
    const [availability, setAvailability] = useState([]);
    const [volunteer, setVolunteer] = React.useState(null);

    React.useEffect(() => {
        // hardcoded id until auth is finished
        const volunteer_id = "faff8f98-bc68-4fab-a4ca-151b09fc40c1";
        fetchVolunteerData(volunteer_id)
            .then((data) => setVolunteer(data))
            .catch((error) => console.error(error));
    }, []);

    return (
        <div className="volunteerProfile">
            <VolunteerLayout 
            pageTitle={pageTitle}
            pageContent={
                <div className="content">
                    <div className="column">
                        <div className="card">
                            <VolunteerDetailsCard volunteer={volunteer} />
                        </div>    
                        <div className="card">
                            <AvailabilityGrid availability={availability} setAvailability={setAvailability} />
                        </div>
                    </div>
                    <div className="column">
                        <div className="card">
                            <ChangePasswordCard volunteer={volunteer} />
                        </div>
                        <div className="card">
                            <ClassPreferencesCard/>
                        </div>
                    </div>
                </div>
            }/>
            {/* <UserProfileForm volunteer_id="1" /> */}
        </div>
      );
};

export default VolunteerProfile;
