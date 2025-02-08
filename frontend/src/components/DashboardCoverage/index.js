import "./index.css";
import React, { useState, useEffect, useRef } from "react";

export default function DashboardCoverage({
  completed,
  upcoming,
  requested,
  future,
}) {
  const progressCompleted = useRef(null);
  const progressUpcoming = useRef(null);
  const totalHours = completed + upcoming + requested;
  useEffect(() => {
    if (progressCompleted.current) {
      progressCompleted.current.style.width = `${
        (completed / totalHours) * 100
      }%`;
    }
    if (progressUpcoming.current) {
      progressUpcoming.current.style.width = `${
        (upcoming / totalHours) * 100
      }%`;
    }
  }, [completed, upcoming, requested, future]);

  return (
    <>
      <div>
        <span className="dash-hours-to-complete">6</span> to be completed
      </div>
      <div className="dash-progress-bar">
        <div ref={progressCompleted} className="dash-progress-completed"></div>
        {future && (
          <div ref={progressUpcoming} className="dash-progress-upcoming"></div>
        )}
      </div>
      <div className="dash-progress-legend">
        <div className="dash-progress-indicator">
          <div className="dash-indicator-blue"></div>
          <span>Completed</span>
        </div>
        {future && (
          <div className="dash-progress-indicator">
            <div className="dash-indicator-grey"></div>
            <span>Upcoming</span>
          </div>
        )}

        <div className="dash-progress-indicator">
          <div className="dash-indicator-white"></div>
          <span>Requested</span>
        </div>
      </div>
    </>
  );
}
