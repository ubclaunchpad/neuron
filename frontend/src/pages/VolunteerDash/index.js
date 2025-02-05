// home/ is the landing page of the application.
import ArrowForwardIcon from "@mui/icons-material/ArrowForwardIos";
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
import { useAuth } from "../../contexts/authContext";
import { SHIFT_TYPES } from "../../data/constants";
import "./index.css";

function VolunteerDash() {
  const { user } = useAuth();
  const [checkIn, setCheckIn] = useState(false);
  const [shifts, setShifts] = useState([]);
  const monthDate = dayjs().date(1).hour(0).minute(0);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [future, setFuture] = useState(false);

  const checkInItem = () => {
    return checkIn ? (
      <div className="dash-check-in">
        <div className="dash-check-in-content">
          <div className="dash-check-in-title">Check In</div>
          <div className="dash-check-in-content">
            Strength & Balance Level 2 • 12:30 PM - 01:00 PM
          </div>
        </div>
        <ArrowForwardIcon sx={{ fontSize: 30 }} />
      </div>
    ) : (
      <div className="dash-next-check-in">
        <div className="dash-next-title">Next Check-In in</div>
        <div className="dash-next-time">
          <span className="dash-next-time-num">0</span> days{" "}
          <span className="dash-next-time-num">1</span> hours{" "}
          <span className="dash-next-time-num">30</span> minutes
        </div>
      </div>
    );
  };

  useEffect(() => {
    const fetchShifts = async () => {
      const body = {
        volunteer_id: user.volunteer.volunteer_id,
        shiftDate: selectedDate.format("YYYY-MM-DD"),
      };
      const response = await getVolunteerShiftsForMonth(body);
      setShifts(response);
    };
    fetchShifts();
  }, [selectedDate, user.volunteer.volunteer_id]);

  const allShifts = shifts.reduce((acc, shift) => {
    const date = shift.shift_date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(shift);
    return acc;
  }, {});

  const groupedUpcomingShifts = shifts
    .filter((shift) => {
      return (
        shift.shift_type ===
          (SHIFT_TYPES.MY_SHIFTS || SHIFT_TYPES.MY_COVERAGE_REQUESTS) &&
        dayjs(shift.shift_date).isAfter(monthDate) &&
        dayjs(shift.shift_date).isAfter(dayjs())
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

  const handleShiftUpdate = () => {
    const fetchShifts = async () => {
      const body = {
        volunteer_id: user.volunteer.volunteer_id,
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
      </div>
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

      <div className="dash-container">
        <div className="dash-col-card dash-grid-item">
          <div className="dash-card-title">Volunteer Hours </div>
          <div className="dash-hours-container">
            <div className="dash-hours">
              <h1 className="dash-completed-hours">20</h1>
              <p>Completed</p>
            </div>
            {future && (
              <div className="dash-hours">
                <h1 className="dash-upcoming-hours">3</h1>
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
          <DashboardCoverage shifts={shifts} future={future} />
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
          {checkInItem()}
        </div>
      </div>
    </main>
  );
}

export default VolunteerDash;
