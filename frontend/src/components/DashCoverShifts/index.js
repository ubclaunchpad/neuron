import "./index.css";
import React, { useState } from "react";
import ArrowForwardIcon from "@mui/icons-material/ArrowForwardIos";
import dayjs from "dayjs";
import ShiftCard from "../ShiftCard";

export default function DashShifts({
  groupedShifts,
  future,
  handleShiftUpdate,
}) {
  const currentDate = dayjs();

  return (
    <div className="dash-shifts-container">
      <div className="dash-card-title">
        {future ? "Shifts In Need of Coverage" : "Shifts Covered"}{" "}
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
                    key={shift.fk_schedule_id}
                    shift={shift}
                    shiftType={shift.shift_type}
                    onUpdate={handleShiftUpdate} // Pass the handler
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
