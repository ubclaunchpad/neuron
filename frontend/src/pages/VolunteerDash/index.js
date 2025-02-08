// home/ is the landing page of the application.
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import { getVolunteerShiftsForMonth } from "../../api/shiftService";
import DashboardCoverage from "../../components/DashboardCoverage";
import DashCoverShifts from "../../components/DashCoverShifts";
import DashShifts from "../../components/DashShifts";
import { SHIFT_TYPES } from "../../data/constants";
import "./index.css";
import CheckInCard from "../../components/CheckInCard";

function VolunteerDash() {
  const volunteerID = localStorage.getItem("volunteerID");
  const [shifts, setShifts] = useState([]);
  const monthDate = dayjs().date(1).hour(0).minute(0);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [future, setFuture] = useState(false);
  var upcomingHours = 0;

  useEffect(() => {
    const fetchShifts = async () => {
      const body = {
        volunteer_id: volunteerID,
        shiftDate: selectedDate.format("YYYY-MM-DD"),
      };
      const response = await getVolunteerShiftsForMonth(body);
      setShifts(response);
    };
    fetchShifts();
  }, [selectedDate, volunteerID]);

  const allShifts = shifts.reduce((acc, shift) => {
    const date = shift.shift_date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(shift);
    return acc;
  }, {});

  const upcomingShifts = shifts.filter((shift) => {
    return (
      shift.shift_type ===
        (SHIFT_TYPES.MY_SHIFTS || SHIFT_TYPES.MY_COVERAGE_REQUESTS) &&
      dayjs(shift.shift_date).isAfter(monthDate) &&
      dayjs(shift.shift_date).isAfter(dayjs())
    );
  });

  const groupedUpcomingShifts = upcomingShifts.reduce((acc, shift) => {
    const date = shift.shift_date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(shift);
    upcomingHours += shift.duration;
    return acc;
  }, {});

  const groupedCoverShifts = shifts
    .filter((shift) => {
      return shift.shift_type === SHIFT_TYPES.COVERAGE;
    })
    .reduce((acc, shift) => {
      const date = shift.shift_date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(shift);
      return acc;
    }, {});

  const completedHours = shifts
    .filter((shift) => {
      return (
        shift.shift_type === SHIFT_TYPES.MY_SHIFTS &&
        dayjs(shift.shift_date).isBefore(dayjs()) &&
        shift.checked_in
      );
    })
    .reduce((acc, shift) => {
      acc += shift.duration;
      return acc;
    }, 0);

  const coverageHours = shifts
    .filter((shift) => {
      return shift.shift_type === SHIFT_TYPES.MY_COVERAGE_REQUESTS;
    })
    .reduce((acc, shift) => {
      acc += shift.duration;
      return acc;
    }, 0);

  const handleShiftUpdate = () => {
    const fetchShifts = async () => {
      const body = {
        volunteer_id: volunteerID,
        shiftDate: selectedDate.format("YYYY-MM-DD"),
      };
      const response = await getVolunteerShiftsForMonth(body);
      setShifts(response);
    };
    fetchShifts();
  };

  useEffect(() => {
    setFuture(selectedDate >= monthDate);
  }, [selectedDate, shifts]);

  return (
    <main className="content-container">
      <div className="content-heading">
        <h2 className="content-title">Dashboard</h2>
        <div className="dash-date-picker">
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              views={["month", "year"]}
              sx={{
                fontSize: "16px",
                color: "var(--primary-blue)",
              }}
              value={selectedDate}
              onChange={(newValue) => setSelectedDate(newValue.day(2))}
            />
          </LocalizationProvider>
        </div>
      </div>
      <div className="dash-container">
        <div className="dash-col-card dash-grid-item">
          <div className="dash-card-title">Volunteer Hours </div>
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
            <div className="dash-card-title">Coverage Hours </div>
            <HelpOutlineIcon sx={{ color: "var(--primary-blue)" }} />
          </div>
          <DashboardCoverage
            completed={completedHours}
            upcoming={upcomingHours}
            requested={coverageHours}
            future={future}
          />
        </div>
        <div className="dash-col-card dash-grid-item">
          <DashShifts
            groupedShifts={future ? groupedUpcomingShifts : allShifts}
            future={future}
            handleShiftUpdate={handleShiftUpdate}
          />
        </div>

        <div className="dash-bottom-right dash-grid-item">
          <div className="dash-col-card">
            <DashCoverShifts
              future={future}
              groupedShifts={groupedCoverShifts}
              handleShiftUpdate={handleShiftUpdate}
            />
          </div>
          {upcomingShifts.length > 0 && (
            <CheckInCard shift={upcomingShifts[0]} />
          )}
        </div>
      </div>
    </main>
  );
}

export default VolunteerDash;
