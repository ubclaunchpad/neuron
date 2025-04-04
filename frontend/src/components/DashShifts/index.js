import ArrowForwardIcon from "@mui/icons-material/ArrowForwardIos";
import dayjs from "dayjs";
import React from "react";
import { useNavigate } from "react-router-dom";
import { getButtonConfig } from "../../utils/buttonConfig";
import ShiftCard from "../ShiftCard";
import "./index.css";

export default function DashShifts({
  groupedShifts,
  future,
  handleShiftUpdate,
  volunteerID,
}) {
  const currentDate = dayjs();
  const navigate = useNavigate();

  return (
    <div className="dash-shifts-container">
      <div
        className="dash-card-title"
        onClick={() => navigate("/schedule")}
      >
        My {future ? "Upcoming" : "Completed"} Shifts{" "}
        <ArrowForwardIcon sx={{ fontSize: "16px", color: "#808080" }} />
      </div>
      <div className="dash-schedule-container">
        {Object.keys(groupedShifts).length > 0 ? (
          Object.keys(groupedShifts).map((date) => (
            <div key={date} className="dash-schedule-date">
              {/* Date Header */}
              <div
                className={`${
                  dayjs(date).isSame(currentDate, "day")
                    ? "selected-date"
                    : "non-selected-date"
                }`}
              >
                {dayjs(date).format("MMM D")}
                {dayjs(date).isSame(currentDate, "day") && " | Today"}
              </div>

              {/* Shift List for this date */}
              <div className="dash-shift-list">
                {groupedShifts[date].map((shift) => (
                  <ShiftCard
                    key={shift.shift_id}
                    shift={shift}
                    shiftType={shift.shift_type}
                    onShiftSelect={handleShiftUpdate} // Pass the handler
                    buttonConfig={getButtonConfig(
                      shift,
                      handleShiftUpdate,
                      volunteerID
                    )}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          <p>No shifts to display for this month.</p>
        )}
      </div>
    </div>
  );
}
