import React, { useState, useEffect } from "react";
import ArrowForwardIcon from "@mui/icons-material/ArrowForwardIos";
import dayjs from "dayjs";

export default function CheckInCard({ shift }) {
  const currentDate = dayjs();
  const shiftDay = dayjs(shift.shift_date).format("YYYY-MM-DD");
  const shiftStart = dayjs(`${shiftDay} ${shift.start_time}`);
  const checkIn = dayjs(shift.shift_date).isSame(currentDate, "day");

  return checkIn ? (
    <div className="dash-check-in">
      <div className="dash-check-in-content">
        <div className="dash-check-in-title">Check In</div>
        <div className="dash-check-in-content">{shift.class_name}</div>
      </div>
      <ArrowForwardIcon sx={{ fontSize: 30 }} />
    </div>
  ) : (
    <div className="dash-next-check-in">
      <div className="dash-next-title">Next Check-In in</div>
      <div className="dash-next-time">
        <span className="dash-next-time-num">
          {shiftStart.diff(currentDate, "d")}
        </span>{" "}
        days{" "}
        <span className="dash-next-time-num">
          {shiftStart.diff(currentDate, "h")}
        </span>{" "}
        hours{" "}
        <span className="dash-next-time-num">
          {shiftStart.diff(currentDate, "m")}
        </span>{" "}
        minutes
      </div>
    </div>
  );
}
