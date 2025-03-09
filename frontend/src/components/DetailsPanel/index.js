import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import { getClassById } from "../../api/classesPageService";
import button_icon_next from "../../assets/images/button-icons/button-icon-next.png";
import button_icon_prev from "../../assets/images/button-icons/button-icon-prev.png";
import button_icon_close from "../../assets/images/button-icons/x-icon.svg";
import { useAuth } from "../../contexts/authContext";
import AdminDetailsPanel from "../AdminDetailsPanel"
import "./index.css";
import VolunteerDetailsPanel from "../VolunteerDetailsPanel";

function DetailsPanel({
  classId,
  classList,
  updates,
  setUpdates,
  setClassId,
  navigate,
  children,
  dynamicShiftButtons = [],
  shiftDetails,
}) {
  const openPanelWidth = '448px'
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
          setPanelWidth(openPanelWidth);
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
    if (time === null || time === undefined || time === "") return "";
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

    const frequencies = [
      { value: "once", label: "Once" },
      { value: "weekly", label: "Weekly" },
      { value: "biweekly", label: "Bi-Weekly" },
    ]

    const formatFrequency = (frequency) => {
      const item = frequencies.find((item) => item.value === frequency);
      if (item) {
        return item.label;
      }
      return frequency;
    }

    return panelInfo.schedules.map((schedule, idx) => (
      <div key={idx} className="panel-titles">
        {formatFrequency(schedule.frequency)} | {dow[schedule.day]}, {formatTime(schedule.start_time)} -{" "}
        {formatTime(schedule.end_time)}
      </div>
    ));
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
        style={{ width: `calc(100% - ${panelWidth})`, overflow: "hidden" }}
      >
        <div className="panel-content">
          {children}
        </div>
      </div>
      <div className="panel-container" style={{ width: openPanelWidth, right: `calc(-${openPanelWidth} + ${panelWidth})` }}>
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
              classId={classId}
              panelInfo={panelInfo}
              navigate={navigate}
              setUpdates={setUpdates}
              setClassId={setClassId}
            /> :
            <VolunteerDetailsPanel
              dynamicShiftButtons={dynamicShiftButtons}
              shiftDetails={shiftDetails}
              panelInfo={panelInfo}
              myClass={myClass}
              classTaken={classTaken}
            />
          }
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
