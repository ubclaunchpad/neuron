import React from "react";
import zoom_icon from "../../assets/zoom.png";
import { formatImageUrl } from "../../api/imageService";
import { COVERAGE_STATUSES } from "../../data/constants";
import ProfileImg from "../ImgFallback";
import "./index.css";

function VolunteerDetailsPanel({ classId, classList, setClassId, dynamicShiftButtons = [], shiftDetails, panelInfo, myClass, classTaken, renderInstructorInfo }) {

    const renderVolunteers = () => {
        const volunteers = panelInfo?.schedules.flatMap(
            (schedule) => schedule.volunteers || []
        );

        // same volunteer may be assigned to multiple schedules within a class
        const uniqueIds = [],
            uniqueVolunteers = [];
        volunteers?.forEach((volunteer) => {
            if (!uniqueIds.includes(volunteer.volunteer_id)) {
            uniqueIds.push(volunteer.volunteer_id);
            uniqueVolunteers.push(volunteer);
            }
        });

        if (!uniqueVolunteers || uniqueVolunteers.length === 0) {
            return <>No volunteer for this class</>;
        }

        return (
            <div className="class-volunteers">
            {uniqueVolunteers.map((volunteer, idx) => {
                const name = volunteer.p_name ?? `${volunteer.f_name} ${volunteer.l_name}`
                
                return (
                <div
                    key={idx}
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                    }}
                >
                    <ProfileImg
                        src={formatImageUrl(volunteer?.fk_image_id)}
                        name={name}
                        className="volunteer-profile"
                    />
                    <div>{name}</div>
                </div>
            );
            })}
            </div>
        );
    };

    return (
        <div className="panel-details">
            <div className="panel-details-shift">
                <div className="panel-details-shift-row">
                    <div className="panel-titles">Status</div>
                    {shiftDetails ? (
                        <div className={`panel-class-status ${shiftDetails.shift_type}`}>
                            {shiftDetails.shift_type === "my-shifts"
                            ? "My Class"
                            : shiftDetails.shift_type === "my-coverage-requests" &&
                                shiftDetails.coverage_status === COVERAGE_STATUSES.OPEN
                            ? "Requested Coverage"
                            : shiftDetails.shift_type === "my-coverage-requests" &&
                                shiftDetails.coverage_status ===
                                COVERAGE_STATUSES.RESOLVED
                            ? "Shift Filled"
                            : shiftDetails.shift_type === "coverage" &&
                                shiftDetails.coverage_status === COVERAGE_STATUSES.OPEN
                            ? "Needs Coverage"
                            : shiftDetails.shift_type === "coverage" &&
                                shiftDetails.coverage_status === COVERAGE_STATUSES.PENDING
                            ? "Requested to Cover"
                            : ""}
                        </div>
                    ) : myClass ? (
                        <div className="panel-class-status my-shifts">My Class</div>
                    ) : classTaken ? (
                        <div className="panel-class-status classTaken">Class Taken</div>
                    ) : (
                        <div className="panel-class-status volunteersNeeded">Volunteers Needed</div>
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
                <div className="panel-details-shift-row zoom-link">
                    <div className="panel-titles">Zoom Link</div>
                    <div className="panel-details-shift-right">
                        <button className="join-class-button">
                            <a href={panelInfo?.zoom_link} >
                            <img 
                                src={zoom_icon}
                                alt="Zoom" 
                                className="zoom-icon" 
                            />
                                Join Class
                            </a>
                        </button>
                    </div>
                </div>
                <div className="panel-details-shift-row zoom-link">
                    <div>
                        <div className="panel-titles">Description</div>
                        <div className="panel-description">
                            {panelInfo?.instructions || "No instructions available"}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Conditionally render buttons based on Shift Card Type*/}
            <div className="panel-buttons">
                {dynamicShiftButtons.map((button, index) => (
                    <button
                        key={index}
                        className={`dynamic-button ${button.buttonClass || ""}`}
                        disabled={button.disabled}
                        onClick={() => button.onClick(shiftDetails)}
                    >
                        {button.icon && (
                            <img
                                src={button.icon}
                                alt={button.label}
                                className={`card-button-icon ${
                                    button.iconColourClass || ""
                                }`}
                            />
                        )}
                        {button.label}
                    </button>
                ))}
            </div>
        </div>
    )
}

export default VolunteerDetailsPanel;