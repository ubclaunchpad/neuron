import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import { getClassById } from "../../api/classesPageService";
import button_icon_close from "../../assets/images/button-icons/button-icon-close.png";
import { useAuth } from "../../contexts/authContext";
import "./index.css";
import VolunteerDetailsPanel from "../VolunteerDetailsPage";
import AdminDetailsPanel from "../AdminDetailsPanel";

function DetailsPanel({ classId, classList, setClassId, children, dynamicShiftButtons = [], shiftDetails }) {
  const [panelWidth, setPanelWidth] = useState("0px");
  const [panelInfo, setPanelInfo] = useState(null);
  const [myClass, setMyClass] = useState(false);
  const [classTaken, setClassTaken] = useState(false);

  const { user, isAdmin } = useAuth();

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

  const myClassCheck = async (data) => {
    const volunteers = data.schedules.flatMap(schedule => schedule.volunteers || []);
    setMyClass(volunteers.some(volunteer => volunteer.user_id === user.user_id));
    setClassTaken(volunteers.length !== 0);
  };

  const formatTime = (time) => {
    const [hour, minute] = time.split(":").map(Number);
    const period = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minute.toString().padStart(2, "0")} ${period}`;
  };

  const renderSchedules = () => {
    if (!panelInfo?.schedules) {
      return <div className="panel-header-dow panel-titles">Not Scheduled</div>;
    }

    // to stay consistent with the javascript Date getDay() function, we start at 0 for Sunday
    const dow = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    return panelInfo.schedules.map((schedule, idx) => (
      <div key={idx} className="panel-header-dow panel-titles">
        {dow[schedule.day]}, {formatTime(schedule.start_time)} -{" "}
        {formatTime(schedule.end_time)}
      </div>
    ))
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
              <span>
                <div>{dayjs(shiftDetails.start_time, 'HH:mm').format('h:mm A')} - {dayjs(shiftDetails.end_time, 'HH:mm').format('h:mm A')}</div>
                <div>{dayjs(shiftDetails.shift_date).format('dddd, MMMM D')}</div>
              </span>
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
        {
          isAdmin ? 
          <AdminDetailsPanel /> :
          <VolunteerDetailsPanel
            classId={classId}
            classList={classList}
            setClassId={setClassId}
            dynamicShiftButtons={dynamicShiftButtons}
            shiftDetails={shiftDetails}
            panelInfo={panelInfo}
            myClass={myClass}
            classTaken={classTaken}
          />
        }
      </div>
    </>
  );
}

export default DetailsPanel;