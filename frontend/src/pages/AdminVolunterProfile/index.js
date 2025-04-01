import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs from "dayjs";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { formatImageUrl } from '../../api/imageService';
import { getVolunteerShiftsForMonth } from "../../api/shiftService";
import { fetchVolunteerData } from "../../api/volunteerService";
import DashboardCoverage from "../../components/DashboardCoverage";
import Notifications from "../../components/Notifications";
import AvailabilityGrid from "../../components/volunteerProfile/availabilityGrid";
import VolunteerDetailsCard from "../../components/volunteerProfile/volunteerDetailsCard";
import AdminVolunteerBadgeCard from '../../components/AdminVolunteerBadgeCard';
import { SHIFT_TYPES } from "../../data/constants";
import "./index.css";

const AdminVolunteerProfile = () => {
    const [searchParams] = useSearchParams();
    const [volunteer, setVolunteer] = useState(null);
    const [availability, setAvailability] = useState([]);
    
    // New state variables
    const [selectedDate, setSelectedDate] = useState(dayjs());
    const [shifts, setShifts] = useState([]);
    const [future, setFuture] = useState(false);
    const monthDate = dayjs().date(1).hour(0).minute(0);

    const fetchShifts = useCallback(async () => {
        const volunteer_id = searchParams.get("volunteer_id");
        if (!volunteer_id) return;
        fetchVolunteerData(volunteer_id)
            .then((data) => {
                // console.log(data);
                setVolunteer(data);
                console.log(data);
            });

        const body = {
            volunteer_id: volunteer_id,
            shiftDate: selectedDate.format("YYYY-MM-DD"),
        };
        
        const response = await getVolunteerShiftsForMonth(body).catch(() => {});
        
        const shiftMap = new Map();
        response?.forEach((shift) => {
            const existingShift = shiftMap.get(shift.shift_id);
            if (
                existingShift &&
                existingShift.shift_type === SHIFT_TYPES.MY_SHIFTS &&
                shift.shift_type === SHIFT_TYPES.MY_COVERAGE_REQUESTS
            ) {
                shiftMap.set(shift.shift_id, shift);
            } else if (!existingShift) {
                shiftMap.set(shift.shift_id, shift);
            }
        });
        
        setShifts(Array.from(shiftMap.values()));
    }, [selectedDate, searchParams]);

    useEffect(() => {
        const fetchData = async () => {
            await fetchShifts();
        };
        fetchData();
    }, [fetchShifts]);

    useEffect(() => {
        setFuture(selectedDate.isSame(monthDate, 'month') || selectedDate.isAfter(monthDate, 'month'));
    }, [selectedDate, monthDate]);

    // Calculate hours
    const completedHours = shifts
        .filter((shift) => 
            shift.shift_type === SHIFT_TYPES.MY_SHIFTS &&
            dayjs(shift.shift_date).isBefore(dayjs()) &&
            shift.checked_in
        )
        .reduce((acc, shift) => acc + shift.duration, 0);

    const upcomingHours = shifts
        .filter((shift) => 
            (shift.shift_type === SHIFT_TYPES.MY_SHIFTS || 
             shift.shift_type === SHIFT_TYPES.MY_COVERAGE_REQUESTS) &&
            dayjs(shift.shift_date).isAfter(monthDate) &&
            dayjs(shift.shift_date).isAfter(dayjs())
        )
        .reduce((acc, shift) => acc + (shift.duration / 60), 0);

    const coverageHours = shifts
        .filter((shift) => shift.shift_type === SHIFT_TYPES.MY_COVERAGE_REQUESTS)
        .reduce((acc, shift) => acc + shift.duration, 0) / 60;

    return (
        <main className="content-container" style={{ overflowY: "auto" }}>
            <div className="content-heading">
                <h2 className="content-title">Volunteer Profile</h2>
                <div className="dash-date-picker">
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                            views={["month", "year"]}
                            sx={{
                                fontSize: "16px",
                                color: "var(--primary-blue)",
                            }}
                            value={selectedDate}
                            onChange={(newValue) => setSelectedDate(newValue.date(1))}
                        />
                    </LocalizationProvider>
                </div>
                <Notifications />
            </div>
            {volunteer &&
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

                        <div className="volunteer-card">
                            <AdminVolunteerBadgeCard volunteer={volunteer}/>
                        </div>

                        <div className="dash-col-card dash-grid-item">
                            <h2 className="dash-card-title">Volunteer Hours</h2>
                            <div className="dash-hours-container">
                                <div className="dash-hours">
                                    <h1 className="dash-completed-hours">{completedHours}</h1>
                                    <p>Completed</p>
                                </div>
                                {future && (
                                    <div className="dash-hours">
                                        <h1 className="dash-upcoming-hours">{upcomingHours}</h1>
                                        <p>Upcoming</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="dash-col-card dash-grid-item">
                            <div className="dash-card-header">
                                <div className="dash-card-title">Coverage Hours</div>
                                <HelpOutlineIcon sx={{ color: "var(--primary-blue)" }} />
                            </div>
                            <DashboardCoverage
                                completed={completedHours}
                                upcoming={upcomingHours}
                                requested={coverageHours}
                                future={future}
                            />
                        </div>
                    </div>
                </div>
            }
        </main>
    );
};

export default AdminVolunteerProfile;