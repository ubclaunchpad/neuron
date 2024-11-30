import React, { useState } from "react";
import ArrowForwardIcon from "@mui/icons-material/ArrowForwardIos";

export default function DashCoverShifts({ future }) {
  return (
    <div className="dash-card-title">
      {future ? "Shifts In Need of Coverage" : "Shifts Covered"}{" "}
      <ArrowForwardIcon sx={{ fontSize: "16px", color: "#808080" }} />
    </div>
  );
}
