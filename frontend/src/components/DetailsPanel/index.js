import "./index.css";
import React, { useEffect, useState } from "react";
import button_icon_close from "../../assets/images/button-icons/button-icon-close.png";
import button_icon_prev from "../../assets/images/button-icons/button-icon-prev.png";
import button_icon_next from "../../assets/images/button-icons/button-icon-next.png";
import zoom_icon from "../../assets/zoom.png";
import { getClassById } from "../../api/classesPageService";
import { isAuthenticated } from "../../api/authService";
import dayjs from "dayjs";

function DetailsPanel({ classId, classList, setClassId, children, dynamicShiftbuttons = [], shiftDetails }) {
  const [panelWidth, setPanelWidth] = useState("0px");
  const [panelInfo, setPanelInfo] = useState(null);
  const [myClass, setMyClass] = useState(false);

  useEffect(() => {
    if (classId) {
      getClassById(classId)
        .then((data) => {
          setPanelInfo(data);
          setPanelWidth("35vw");
          myClassCheck(data);
        })
        .catch((error) => {
          console.error(error);
          setPanelWidth("0px");
        });
    } else {
      setPanelWidth("0px");
    }
  }, [classId]);

  const getCurrentUserId = () => {
    const data = isAuthenticated();
    return data.then((result) => result.user.user_id).catch(() => null);
  };

  const myClassCheck = (data) => {
    if (data.volunteer_user_ids) {
      const userIds = data.volunteer_user_ids.split(",");
      const currentUserId = getCurrentUserId();
      setMyClass(userIds.includes(currentUserId));
    } else {
      setMyClass(false);
    }
  };

  const formatTime = (time) => {
    const [hour, minute] = time.split(":").map(Number);
    const period = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minute.toString().padStart(2, "0")} ${period}`;
  };

  const renderSchedules = () => {
    if (
      !panelInfo?.days_of_week ||
      !panelInfo?.start_times ||
      !panelInfo?.end_times
    ) {
      return <div className="panel-header-dow panel-titles">Not Scheduled</div>;
    }

    const dow = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];

    const days = panelInfo.days_of_week.split(",");
    const startTimes = panelInfo.start_times.split(",");
    const endTimes = panelInfo.end_times.split(",");

    return days.map((day, index) => (
      <div key={index} className="panel-header-dow panel-titles">
        {dow[day - 1]}, {formatTime(startTimes[index])} -{" "}
        {formatTime(endTimes[index])}
      </div>
    ));
  };

  const renderVolunteers = () => {
    if (!panelInfo?.volunteer_f_names || !panelInfo?.volunteer_l_names) {
      return <>No volunteer for this class</>;
    }

    const fNames = panelInfo.volunteer_f_names.split(",");
    const lNames = panelInfo.volunteer_l_names.split(",");
    const volunteers = fNames.map(
      (fName, index) => `${fName} ${lNames[index]}`
    );

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {volunteers.map((vol, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <div className="volunteer-profile"></div>
            <div>{vol}</div>
          </div>
        ))}
      </div>
    );
  };

  const handleToPrev = () => {
    if (!classList || !classId) return;
    const currentIndex = classList.findIndex((c) => c.class_id === classId);
    if (currentIndex > 0) {
      const prevClass = classList[currentIndex - 1];
      setClassId(prevClass.class_id);
    }
  };

  const handleToNext = () => {
    if (!classList || !classId) return;
    const currentIndex = classList.findIndex((c) => c.class_id === classId);
    if (currentIndex < classList.length - 1) {
      const nextClass = classList[currentIndex + 1];
      setClassId(nextClass.class_id);
    }
  };

  return (
    <>
      <div
        className="main-container"
        style={{ width: `calc(100% - ${panelWidth})` }}
      >
        {children}
      </div>
      <div className="panel-container" style={{ width: panelWidth }}>
        <div className="panel-header">
          {shiftDetails ? (
              <span>{dayjs(shiftDetails.shift_date).format('YYYY-MM-DD')}</span>
          ) : (
              renderSchedules()
          )}
          <div className="panel-header-class-name">
            {panelInfo?.class_name || "N/A"}
          </div>
          <button
            className="panel-button-icon panel-button-icon-close"
            onClick={() => {
              setPanelWidth("0px");
              setClassId(null);
            }}
          >
            <img
              alt="Close"
              style={{ width: 16, height: 16 }}
              src={button_icon_close}
            />
          </button>
        </div>
        <div className="panel-details">
          <div className="panel-details-shift">
            <div className="panel-details-shift-row">
              <div className="panel-titles">Status</div>
              {shiftDetails ? (
                <div className={shiftDetails.shift_type}>
                  {shiftDetails.shift_type === "my-shifts"
                    ? "My Class"
                    : shiftDetails.shift_type === "my-coverage-requests"
                    ? "Requested Coverage"
                    : shiftDetails.shift_type === "coverage"
                    ? "Needs Coverage"
                    : ""}
                </div>
              ) : myClass ? (
                <div className="my-shifts">My Class</div> 
              ) : (
                <div className="classTaken">Class Taken</div> 
              )}
            </div>
            <div className="panel-details-shift-row">
              <div className="panel-titles">Instructor</div>
              <div className="panel-details-shift-right">
                {panelInfo?.instructor_f_name && panelInfo?.instructor_l_name
                  ? `${panelInfo.instructor_f_name} ${panelInfo.instructor_l_name}`
                  : "No instructor available"}
              </div>
            </div>
            <div className="panel-details-shift-row">
              <div className="panel-titles">Volunteers</div>
              <div className="panel-details-shift-right">
                {renderVolunteers()}
              </div>
            </div>
          </div>
          <div className="panel-details-shift-row">
            {shiftDetails && shiftDetails.shift_type === "my-shifts" && (
              <>
                <div className="panel-titles">Zoom Link</div>
                <div className="panel-details-shift-right">
                  <button className="join-class-button">
                  <a href={shiftDetails.zoom_link} >
                    <img 
                      src={zoom_icon}
                      alt="Zoom" 
                      className="zoom-icon" 
                    />
                    Join Class
                  </a>
                  </button>
                </div>
              </>
            )}
          </div>
          
          <div className="panel-details-description">
            <div className="panel-titles">Description</div>
            <div className="panel-description">
              {panelInfo?.instructions || "No instructions available"}
            </div>
          </div>
          { /* Conditionally render buttons based on Shift Card Type*/}
          <div className="panel-buttons">
              {dynamicShiftbuttons.map((button, index) => (
                  <button
                      key={index}
                      className={`dynamic-button ${button.buttonClass || ''}`}
                      disabled={button.disabled}
                      onClick={() => button.onClick(shiftDetails)}
                  >
                      {button.icon && <img src={button.icon} className="card-button-icon"/>}
                      {button.label}
                  </button>
              ))}
          </div>
          <div className="button-icons">
            <button className="panel-button-icon" onClick={handleToPrev}>
              <img
                alt="Previous"
                src={button_icon_prev}
                style={{ width: 16, height: 16 }}
              />
            </button>
            <button className="panel-button-icon" onClick={handleToNext}>
              <img
                alt="Next"
                src={button_icon_next}
                style={{ width: 16, height: 16 }}
              />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default DetailsPanel;