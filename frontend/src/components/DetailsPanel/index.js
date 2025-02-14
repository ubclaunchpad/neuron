import "./index.css";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import { getClassById } from "../../api/classesPageService";
import email from "../../assets/email.png";
import button_icon_close from "../../assets/images/button-icons/x-icon.svg";
import { useAuth } from "../../contexts/authContext";
import { SHIFT_TYPES } from "../../data/constants";
import AdminDetailsPanel from "../AdminDetailsPanel"
import "./index.css";
import VolunteerDetailsPanel from "../VolunteerDetailsPanel";

function DetailsPanel({
  classId,
  classList,
  updates,
  setClassId,
  setEditing,
  children,
  dynamicShiftButtons = [],
  shiftDetails,
}) {
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
  }, [classId, updates]);

  const myClassCheck = async (data) => {
    const volunteers = data.schedules.flatMap(
      (schedule) => schedule.volunteers || []
    );
    console.log("Volunteers", volunteers)
    console.log("User", user)
    setMyClass(
      volunteers.some((volunteer) => volunteer.fk_user_id === user?.user_id)
    );
    setClassTaken(volunteers.length !== 0);
  };

  const formatTime = (time) => {
    const [hour, minute] = time.split(":").map(Number);
    const period = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minute.toString().padStart(2, "0")} ${period}`;
  };

  const renderSchedules = () => {
    if (!panelInfo?.schedules || panelInfo?.schedules.length === 0) {
      return <div className="panel-titles">Not Scheduled</div>;
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
      <div key={idx} className="panel-titles">
        {dow[schedule.day]}, {formatTime(schedule.start_time)} -{" "}
        {formatTime(schedule.end_time)}
      </div>
    ));
  };

  const renderInstructorInfo = () => {
    if (!panelInfo?.instructor_email) return;

    return (
    <>
        {panelInfo?.instructor_f_name && panelInfo?.instructor_l_name
          ? `${panelInfo.instructor_f_name} ${panelInfo.instructor_l_name}`
          : "No instructor available"}
        {shiftDetails &&
        shiftDetails.shift_type &&
        (shiftDetails.shift_type === SHIFT_TYPES.MY_SHIFTS ||
          shiftDetails.shift_type === SHIFT_TYPES.MY_COVERAGE_REQUESTS) ? (
          <button
            className="email-icon panel-button-icon"
            onClick={() => {
            window.open(`mailto:${panelInfo.instructor_email}`);
            }}
          >
            <img alt="Email" style={{ width: 16, height: 16 }} src={email} />
          </button>
        ) : null}
      </>
    );
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
        <div className="panel-content">
          <div className="panel-header">
            {shiftDetails ? (
              <span className="panel-header-date-details">
                <div>{dayjs(shiftDetails.shift_date).format("dddd, MMMM D")}</div>
                <div>
                  {dayjs(shiftDetails.start_time, "HH:mm").format("h:mm A")} -{" "}
                  {dayjs(shiftDetails.end_time, "HH:mm").format("h:mm A")}
                </div>
              </span>
            ) : (
              // admin side shows full schedules in panel details
              !isAdmin &&
                <div className="panel-class-schedules">
                  {renderSchedules()}
                </div>
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
            <AdminDetailsPanel
              panelInfo={panelInfo}
              renderInstructorInfo={renderInstructorInfo} 
              setEditing={setEditing}
            /> :
            <VolunteerDetailsPanel
              classId={classId}
              classList={classList}
              setClassId={setClassId}
              dynamicShiftButtons={dynamicShiftButtons}
              shiftDetails={shiftDetails}
              panelInfo={panelInfo}
              myClass={myClass}
              classTaken={classTaken}
              renderInstructorInfo={renderInstructorInfo}
            />
          }
        </div>
      </div>
    </>
  );
}

export default DetailsPanel;
