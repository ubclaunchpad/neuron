// home/ is the landing page of the application.
import "./index.css";
import React from "react";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import VolunteerLayout from "../../components/volunteerLayout";
import { isAuthenticated } from "../../api/authService";
import ArrowForwardIcon from "@mui/icons-material/ArrowForwardIos";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import DashShifts from "../../components/DashShifts";
import DashCoverShifts from "../../components/DashCoverShifts";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import DashboardCoverage from "../../components/DashboardCoverage";
import { getVolunteerShiftsForMonth } from "../../api/shiftService";
import { SHIFT_TYPES } from "../../data/constants";

function VolunteerDash() {
  const volunteerID = localStorage.getItem("volunteerID");
  const [loading, setLoading] = useState(true);
  const [checkIn, setCheckIn] = useState(false);
  const [shifts, setShifts] = useState([]);
  const monthDate = dayjs().date(1).hour(0).minute(0);
  const [selectedDate, setSelectedDate] = useState(monthDate);
  const [future, setFuture] = useState(false);

  const navigate = useNavigate();

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
    isAuthenticated()
      .then((response) => {
        console.log(response);
        if (!response.isAuthenticated) {
          navigate("/auth/login");
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  useEffect(() => {
    const fetchShifts = async () => {
      const body = {
        volunteer_id: volunteerID,
        shiftDate: selectedDate.format("YYYY-MM-DD"),
      };
      const response = await getVolunteerShiftsForMonth(body);

      // const filteredShifts = response.filter((shift) => {
      //   if (filter === "all-shifts") {
      //     return true;
      //   }
      //   return shift.shift_type === filter;
      // });
      setShifts(response);
      console.log(response);
    };
    fetchShifts();
  }, [selectedDate, volunteerID]);

  const groupedUpcomingShifts = shifts
    .filter((shift) => {
      return (
        shift.shift_type ===
          (SHIFT_TYPES.MY_SHIFTS || SHIFT_TYPES.MY_COVERAGE_REQUESTS) &&
        dayjs(shift.shift_date).isAfter(monthDate)
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

  const groupedShifts = shifts.reduce((acc, shift) => {
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
        volunteer_id: volunteerID,
        shiftDate: selectedDate.format("YYYY-MM-DD"),
      };
      const response = await getVolunteerShiftsForMonth(body);
      // const filteredShifts = response.filter((shift) => {
      //   if (filter === "all-shifts") {
      //     return true;
      //   }
      //   return shift.shift_type === filter;
      // });
      setShifts(response);
    };
    fetchShifts();
  };

  useEffect(() => {
    setFuture(selectedDate >= monthDate);
  }, [selectedDate]);

  return (
    <VolunteerLayout pageTitle="Dashboard">
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DatePicker
          views={["month", "year"]}
          sx={{
            position: "absolute",
            right: "4rem",
            top: "1rem",
            fontSize: "16px",
            color: "var(--primary-blue)",
          }}
          value={selectedDate}
          onChange={(newValue) => setSelectedDate(newValue)}
        />
      </LocalizationProvider>

      <div className="dash-container">
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
          <DashboardCoverage shifts={shifts} future={future} />
        </div>
        <div
          className="dash-col-card dash-grid-item dash-col-card-click"
          // onClick={navigate("/volunteer/schedule")}
        >
          <DashShifts
            groupedShifts={groupedUpcomingShifts}
            future={future}
            handleShiftUpdate={handleShiftUpdate}
          />
        </div>

        <div className="dash-bottom-right dash-grid-item">
          <div
            className="dash-col-card dash-col-card-click"
            // onClick={navigate("/volunteer/schedule")}
          >
            <DashCoverShifts
              future={future}
              groupedShifts={groupedCoverShifts}
              handleShiftUpdate={handleShiftUpdate}
            />
          </div>
          {checkInItem()}
        </div>
      </div>
    </VolunteerLayout>
  );
}

export default VolunteerDash;
