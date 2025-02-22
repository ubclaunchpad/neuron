// home/ is the landing page of the application.
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs from "dayjs";
import React, { useEffect, useState, useCallback } from "react";
import { getVolunteerShiftsForMonth } from "../../api/shiftService";
import DashboardCoverage from "../../components/DashboardCoverage";
import DashCoverShifts from "../../components/DashCoverShifts";
import DashShifts from "../../components/DashShifts";
import { useAuth } from "../../contexts/authContext";
import { SHIFT_TYPES } from "../../data/constants";
import "./index.css";
import CheckInCard from "../../components/CheckInCard";

function VolunteerDash() {
  const volunteerID = localStorage.getItem("volunteerID");
  const { user } = useAuth();
  const [shifts, setShifts] = useState([]);
  const monthDate = dayjs().date(1).hour(0).minute(0);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [future, setFuture] = useState(false);
  var upcomingHours = 0;

  const fetchShifts = useCallback(async () => {
    const body = {
      volunteer_id: user?.volunteer.volunteer_id,
      shiftDate: selectedDate.format("YYYY-MM-DD"),
    };
    const response = await getVolunteerShiftsForMonth(body);

    const shiftMap = new Map();
    response.forEach((shift) => {
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
  }, [selectedDate, user?.volunteer.volunteer_id]);

  useEffect(() => {
    const fetchData = async () => {
      await fetchShifts();
    };
    fetchData();
  }, [fetchShifts]);

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
    upcomingHours += shift.duration / 60;
    return acc;
  }, {});

  const groupedCoverShifts = shifts
    .filter((shift) => {
      const shiftDay = dayjs(shift.shift_date).format("YYYY-MM-DD");
      const shiftEnd = dayjs(`${shiftDay} ${shift.end_time}`);
      const pastShift = dayjs().isAfter(shiftEnd);

      return (
        (shift.shift_type === SHIFT_TYPES.MY_SHIFTS ||
          shift.shift_type === SHIFT_TYPES.MY_COVERAGE_REQUESTS) &&
        !pastShift
      );
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

  const coverageHours =
    shifts
      .filter((shift) => {
        return shift.shift_type === SHIFT_TYPES.MY_COVERAGE_REQUESTS;
      })
      .reduce((acc, shift) => {
        acc += shift.duration;
        return acc;
      }, 0) / 60;

  console.log(completedHours, coverageHours, upcomingHours);

  const handleShiftUpdate = () => {
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
              onChange={(newValue) => setSelectedDate(newValue.date(1))}
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
            volunteerID={user?.volunteer.volunteer_id}
          />
        </div>

        <div className="dash-bottom-right dash-grid-item">
          <div className="dash-col-card">
            <DashCoverShifts
              future={future}
              groupedShifts={groupedCoverShifts}
              handleShiftUpdate={handleShiftUpdate}
              volunteerID={user?.volunteer.volunteer_id}
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
