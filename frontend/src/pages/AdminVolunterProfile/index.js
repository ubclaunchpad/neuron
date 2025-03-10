import ChangePasswordCard from "../../components/volunteerProfile/changePasswordCard";
import VolunteerDetailsCard from "../../components/volunteerProfile/volunteerDetailsCard";
import AvailabilityGrid from "../../components/volunteerProfile/availabilityGrid";
import { formatImageUrl } from '../../api/imageService';
import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchVolunteerData } from "../../api/volunteerService";
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import DashboardCoverage from "../../components/DashboardCoverage";
import Notifications from "../../components/Notifications";

const AdminVolunteerProfile = () => {
    const [searchParams] = useSearchParams();

    const [availability, setAvailability] = useState([]);
    const [volunteer, setVolunteer] = useState(null);

    async function getVolunteerData(volunteer_id) {
        const volunteerData = await fetchVolunteerData(volunteer_id);
        setVolunteer(volunteerData);
    }

    useEffect(() => {
        const volunteer_id = searchParams.get("volunteer_id");
        if (!volunteer_id) return;
        getVolunteerData(volunteer_id);
    }, [searchParams]);


    return (
        <main className="content-container" style={{
          overflowY: "auto",
        }}>
          <div className="content-heading">
            <h2 className="content-title">Volunteer Profile</h2>
            <Notifications />
          </div>
          {volunteer ?
            <div className="content">
                <div className="column-1">
                    <div className="volunteer-card">
                        <VolunteerDetailsCard volunteer={{
                            ...volunteer,
                            profile_picture: formatImageUrl(volunteer.fk_image_id)
                        }} type="admin" />
                    </div>
                    <div className="availability-card">
                        <AvailabilityGrid
                            volunteerId={volunteer.volunteer_id}
                            availability={availability}
                            setAvailability={setAvailability}
                            type="admin"
                        />
                    </div>
                </div>
                <div className="column-2">
                    <div className="dash-col-card dash-grid-item">
                        <div className="dash-card-title">Volunteer Hours </div>
                        <div className="dash-hours-container">
                            <div className="dash-hours">
                            <h1 className="dash-completed-hours">20</h1>
                            <p>Completed</p>
                            </div>
                            <div className="dash-hours">
                                <h1 className="dash-upcoming-hours">3</h1>
                                <p>Upcoming</p>
                            </div>
                        </div>
                    </div>

                    <div className="dash-col-card dash-grid-item">
                        <div className="dash-card-header">
                            <div className="dash-card-title">Coverage Hours </div>
                            <HelpOutlineIcon sx={{ color: "var(--primary-blue)" }} />
                        </div>
                        <DashboardCoverage future={false} />
                    </div>
                </div>
            </div>
            : <></> 
          }
        </main>
      );
}

export default AdminVolunteerProfile