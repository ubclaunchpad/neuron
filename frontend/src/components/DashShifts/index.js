import React, { useState } from "react";
import ArrowForwardIcon from "@mui/icons-material/ArrowForwardIos";

export default function DashShifts({ current }) {
  return (
    <div className="dash-card-title">
      My {current ? "Upcoming" : "Completed"} Shifts{" "}
      <ArrowForwardIcon sx={{ fontSize: "16px", color: "#808080" }} />
    </div>
  );
}
