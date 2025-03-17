import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import { getClassById } from "../../api/classesPageService";
import { formatImageUrl } from "../../api/imageService";
import email from "../../assets/email.png";
import button_icon_next from "../../assets/images/button-icons/button-icon-next.png";
import button_icon_prev from "../../assets/images/button-icons/button-icon-prev.png";
import button_icon_close from "../../assets/images/button-icons/x-icon.svg";
import zoom_icon from "../../assets/zoom.png";
import { useAuth } from "../../contexts/authContext";
import { COVERAGE_STATUSES, SHIFT_TYPES } from "../../data/constants";
import ProfileImg from "../ImgFallback";
import "./index.css";

function CoverageDetailsPanel({
  classId,
  classList,
  setClassId,
  children,
  dynamicShiftButtons = [],
  shiftDetails,
}) {
  const openPanelWidth = "448px";
  const [panelWidth, setPanelWidth] = useState("0px");
  const [panelInfo, setPanelInfo] = useState(null);

  useEffect(() => {
    if (classId) {
      getClassById(classId)
        .then((data) => {
          setPanelInfo(data);
          setPanelWidth(openPanelWidth);
        })
        .catch((error) => {
          console.error(error);
          setPanelWidth("0px");
        });
    } else {
      setPanelWidth("0px");
    }
  }, [classId]);

  const formatTime = (time) => {
    if (time === null || time === undefined || time === "") return "";
    const [hour, minute] = time.split(":").map(Number);
    const period = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minute.toString().padStart(2, "0")} ${period}`;
  };

  const renderSchedules = () => {
    if (!panelInfo?.schedules) {
      return <div className="coverage-panel-header-dow coverage-panel-titles">Not Scheduled</div>;
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
      <div key={idx} className="coverage-panel-header-dow coverage-panel-titles">
        {dow[schedule.day]}, {formatTime(schedule.start_time)} -{" "}
        {formatTime(schedule.end_time)}
      </div>
    ));
  };

  // const renderVolunteers = () => {
  //   const volunteers = panelInfo?.schedules.flatMap(
  //     (schedule) => schedule.volunteers || []
  //   );

  //   // same volunteer may be assigned to multiple schedules within a class
  //   const uniqueIds = [],
  //     uniqueVolunteers = [];
  //   volunteers?.forEach((volunteer) => {
  //     if (!uniqueIds.includes(volunteer.volunteer_id)) {
  //       uniqueIds.push(volunteer.volunteer_id);
  //       uniqueVolunteers.push(volunteer);
  //     }
  //   });

  //   if (!uniqueVolunteers || uniqueVolunteers.length === 0) {
  //     return <>No volunteer for this class</>;
  //   }

  //   return (
  //     <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
  //       {uniqueVolunteers.map((volunteer, idx) => {
  //         const name =
  //           volunteer.p_name ?? `${volunteer.f_name} ${volunteer.l_name}`;

  //         return (
  //           <div
  //             key={idx}
  //             style={{
  //               display: "flex",
  //               flexDirection: "row",
  //               alignItems: "center",
  //             }}
  //           >
  //             <ProfileImg
  //               src={formatImageUrl(volunteer?.fk_image_id)}
  //               name={name}
  //               className="volunteer-profile"
  //             ></ProfileImg>
  //             <div>{name}</div>
  //           </div>
  //         );
  //       })}
  //     </div>
  //   );
  // };

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

  const renderInstructorInfo = () => {
    const instructors = panelInfo?.schedules.map((schedule) => ({
      id: schedule.fk_instructor_id,
      f_name: schedule.instructor_f_name,
      l_name: schedule.instructor_l_name,
      email: schedule.instructor_email,
    }));

    // same volunteer may be assigned to multiple schedules within a class
    const uniqueIds = [],
      uniqueInstructors = [];
    instructors?.forEach((instructor) => {
      if (!uniqueIds.includes(instructor.id)) {
        uniqueIds.push(instructor.id);
        uniqueInstructors.push(instructor);
      }
    });

    if (!uniqueInstructors || uniqueInstructors.length === 0) {
      return <>No instructors for this class</>;
    }

    return (
      <>
        {uniqueInstructors.map((instructor, idx) => (
          <div className="coverage-instructor-item" key={idx}>
            <div>{instructor.f_name + " " + instructor.l_name}</div>
            <button
              className="coverage-instructor-email"
              onClick={() => {
                window.open(`mailto:${instructor.email}`);
              }}
            >
              {instructor.email}
            </button>
          </div>
        ))}
      </>
    );
  };

  return (
    <>
      <div
        className="coverage-main-container"
        style={{ width: `calc(100% - ${panelWidth})`, overflow: "hidden" }}
      >
        <div className="coverage-panel-content">{children}</div>
      </div>
      <div
        className="coverage-panel-container"
        style={{
          width: openPanelWidth,
          right: `calc(-${openPanelWidth} + ${panelWidth})`,
        }}
      >
        <div className="coverage-panel-header">
          {shiftDetails ? (
            <span className="coverage-panel-header-date-details">
              <div>{dayjs(shiftDetails.shift_date).format("dddd, MMMM D")}</div>
              <div>
                {dayjs(shiftDetails.start_time, "HH:mm").format("h:mm A")} -{" "}
                {dayjs(shiftDetails.end_time, "HH:mm").format("h:mm A")}
              </div>
            </span>
          ) : (
            renderSchedules()
          )}
          <div className="coverage-panel-header-class-name">
            {panelInfo?.class_name || "N/A"}
          </div>
          <button
            className="coverage-panel-button-icon coverage-panel-button-icon-close"
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
        <div className="coverage-panel-details">
          <div className="coverage-panel-details-shift">
            <div className="coverage-panel-details-shift-instructors-row">
              <div className="coverage-panel-titles">Instructor</div>
              <div className="coverage-panel-details-instructors">
                {renderInstructorInfo()}
              </div>
            </div>
            <div className="coverage-panel-details-shift-row">
              <div className="coverage-panel-titles">Volunteers</div>
              <div className="coverage-panel-details-shift-right">
                {shiftDetails?.volunteer_f_name}{" "}
                {shiftDetails?.volunteer_l_name}
              </div>
            </div>
            <div className="coverage-panel-details-shift-row">
              <div className="coverage-panel-titles">Requested By</div>
              <div className="coverage-panel-description">
                {shiftDetails?.volunteer_f_name}{" "}
                {shiftDetails?.volunteer_l_name}
              </div>
            </div>
            <div className="coverage-panel-details-shift-row">
              <div className="coverage-panel-titles">Requested For</div>
              <div className="coverage-panel-description">This session only</div>
            </div>
            <div className="coverage-panel-details-shift-row">
              <div className="coverage-panel-titles">Requested On</div>
              <div className="coverage-panel-description">
                {dayjs(shiftDetails?.shift_date).format("YYYY-MM-DD")}
              </div>
            </div>
            <div className="coverage-panel-details-shift-row">
              <div className="coverage-panel-titles">Reason for Request</div>
              <div className="coverage-panel-description">
                {shiftDetails?.absence_request.category}
              </div>
            </div>
            <div className="coverage-panel-details-shift-row">
              <div className="coverage-panel-titles">Reason Details</div>
              <div className="coverage-panel-description">
                {shiftDetails?.absence_request.details}
              </div>
            </div>
          </div>

          {/* Conditionally render buttons based on Shift Card Type*/}
          <div className="coverage-panel-buttons">
            {dynamicShiftButtons.map((button, index) => (
              <button
                key={index}
                className={`coverage-dynamic-button ${
                  button.buttonClass || ""
                }`}
                disabled={button.disabled}
                onClick={() => button.onClick(shiftDetails)}
              >
                {button.icon && (
                  <img
                    src={button.icon}
                    className={`coverage-card-button-icon ${
                      button.iconColourClass || ""
                    }`}
                  />
                )}
                {button.label}
              </button>
            ))}
          </div>
          <div className="coverage-button-icons">
            <button className="coverage-panel-button-icon" onClick={handleToPrev}>
              <img
                alt="Previous"
                src={button_icon_prev}
                style={{ width: 16, height: 16 }}
              />
            </button>
            <button className="coverage-panel-button-icon" onClick={handleToNext}>
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

export default CoverageDetailsPanel;