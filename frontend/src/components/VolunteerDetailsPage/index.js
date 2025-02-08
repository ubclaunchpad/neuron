import React from "react";
import email from "../../assets/email.png";
import button_icon_next from "../../assets/images/button-icons/button-icon-next.png";
import button_icon_prev from "../../assets/images/button-icons/button-icon-prev.png";
import zoom_icon from "../../assets/zoom.png";
import { SHIFT_TYPES } from "../../data/constants";
import "./index.css";

function VolunteerDetailsPanel({ classId, classList, setClassId, dynamicShiftButtons = [], shiftDetails, panelInfo, myClass, classTaken }) {

    const renderVolunteers = () => {
        const volunteers = panelInfo?.schedules.flatMap(schedule => schedule.volunteers || []);

        // same volunteer may be assigned to multiple schedules within a class
        const uniqueIds = [], uniqueVolunteers = [];
        volunteers?.forEach((volunteer) => {
            if (!uniqueIds.includes(volunteer.volunteer_id)) {
                uniqueIds.push(volunteer.volunteer_id);
                uniqueVolunteers.push(volunteer);
            }
        })
        
        if (!uniqueVolunteers || uniqueVolunteers.length === 0) {
            return <>No volunteer for this class</>;
        }

        return (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {uniqueVolunteers.map((volunteer, idx) => (
            <div
                key={idx}
                style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                }}
            >
                <div className="volunteer-profile"></div>
                <div>{volunteer.f_name} {volunteer.l_name}</div>
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

    const renderInstructorInfo = () => {
        if (!panelInfo?.instructor_email) return;
    
        return (
        <>
            {panelInfo?.instructor_f_name && panelInfo?.instructor_l_name
            ? `${panelInfo.instructor_f_name} ${panelInfo.instructor_l_name}`
            : "No instructor available"}
            {shiftDetails && shiftDetails.shift_type && (shiftDetails.shift_type === SHIFT_TYPES.MY_SHIFTS || shiftDetails.shift_type === SHIFT_TYPES.MY_COVERAGE_REQUESTS) 
            ?
            <button
                className="email-icon panel-button-icon"
                onClick={() => {
                window.open(`mailto:${panelInfo.instructor_email}`);
                }}
            >
                <img
                alt="Email"
                style={{ width: 16, height: 16 }}
                src={email}
                />
            </button>
            : null}
        </>
        );
    };

    return (
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
                ) : classTaken ? (
                <div className="classTaken">Class Taken</div> 
                ) : (
                <div className="volunteersNeeded">Volunteers Needed</div> 
                )}
            </div>
            <div className="panel-details-shift-row">
                <div className="panel-titles">Instructor</div>
                <div className="panel-details-shift-right">
                {renderInstructorInfo()}
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
                {dynamicShiftButtons.map((button, index) => (
                    <button
                        key={index}
                        className={`dynamic-button ${button.buttonClass || ''}`}
                        disabled={button.disabled}
                        onClick={button.onClick}
                    >
                        {button.icon && <img src={button.icon} alt="Details Panel Button" className="card-button-icon"/>}
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
    )
}

export default VolunteerDetailsPanel;