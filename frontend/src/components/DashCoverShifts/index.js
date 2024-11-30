import React, { useState } from "react";
import ArrowForwardIcon from "@mui/icons-material/ArrowForwardIos";

export default function DashCoverShifts({ current }) {
  return (
    <div className="dash-card-title">
      {current ? "Shifts In Need of Coverage" : "Shifts Covered"}{" "}
      <ArrowForwardIcon sx={{ fontSize: "16px", color: "#808080" }} />
    </div>
  );
}
