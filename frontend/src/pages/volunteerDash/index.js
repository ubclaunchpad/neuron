// home/ is the landing page of the application.
import "./index.css";
import React from "react";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import VolunteerLayout from "../../components/volunteerLayout";
import { getHelloWorld } from "../../api/homePageService";
import { isAuthenticated } from "../../api/authService";

function VolunteerDash() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const progressCompleted = useRef(null);
  const progressUpcoming = useRef(null);
  const navigate = useNavigate();

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
    getHelloWorld()
      .then((data) => {
        setData(data.message);
        if (progressCompleted.current && progressUpcoming.current) {
          progressCompleted.current.style.width = "35%";
          progressUpcoming.current.style.width = "20%";
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setLoading(false);
      });
    // eslint-disable-next-line
  }, []);

  return (
    <VolunteerLayout pageTitle="Dashboard">
      <div className="dash-container">
        <div className="dash-col-card dash-grid-item">
          <div className="dash-card-title">Volunteer Hours</div>
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
            <div className="dash-card-title">Coverage Hours</div>
            <div className="dash-coverage-help">H</div>
          </div>
          <div>
            <span className="dash-hours-to-complete">6</span> to be completed
          </div>
          <div className="dash-progress-bar">
            <div
              ref={progressCompleted}
              className="dash-progress-completed"
            ></div>
            <div
              ref={progressUpcoming}
              className="dash-progress-upcoming"
            ></div>
          </div>
          <div className="dash-progress-legend">
            <div className="dash-progress-indicator">
              <div className="dash-indicator-blue"></div>
              <span>Completed</span>
            </div>
            <div className="dash-progress-indicator">
              <div className="dash-indicator-grey"></div>
              <span>Upcoming</span>
            </div>
            <div className="dash-progress-indicator">
              <div className="dash-indicator-white"></div>
              <span>Requested</span>
            </div>
          </div>
        </div>
        <div className="dash-col-card dash-grid-item">
          <div className="dash-card-title">My Upcoming Shifts</div>
        </div>

        <div className="dash-bottom-right dash-grid-item">
          <div className="dash-col-card">
            <div className="dash-card-title">Shifts In Need of Coverage</div>
          </div>
        </div>
      </div>
    </VolunteerLayout>
  );
}

export default VolunteerDash;
