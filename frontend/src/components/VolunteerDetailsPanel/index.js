import React from "react";
import { formatImageUrl } from "../../api/imageService";
import zoom_icon from "../../assets/zoom.png";
import { COVERAGE_STATUSES } from "../../data/constants";
import ProfileImg from "../ImgFallback";
import "./index.css";
import checked_in from "../../assets/checked-in.png";
import not_checked_in from "../../assets/not-checked-in.png";
import { checkInShift } from "../../api/shiftService";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

function VolunteerDetailsPanel({ dynamicShiftButtons = [], shiftDetails, panelInfo, myClass, classTaken }) {
    const [volunteersInShift, setVolunteersInShift] = useState([]);
    const navigate = useNavigate();
    
    useEffect(()=> {
        if (shiftDetails)
            setVolunteersInShift(shiftDetails.volunteers);
    }, [shiftDetails]);

    const renderCheckedInButton = (volunteer) => {
        for (const vol of volunteersInShift) {
            if (vol.volunteer_id === volunteer.volunteer_id) {
                if (vol.checked_in === 0) {
                    return (<div className="checked-in-status-btn">
                        <img src={not_checked_in}/>
                        {renderCheckedInPopUp(vol.shift_id, false)}
                    </div>);
                } else {
                    return (<div className="checked-in-status-btn">
                        <img src={checked_in}/>
                        <>{renderCheckedInPopUp(vol.shift_id, true)}</>
                    </div>);
                }
            }
        }
        return null;
    }

    const renderCheckedInPopUp = (shift_id, checked_in) => {
        if (!checked_in) {
            return (
            <div className="checked-in-popup">
                <div className="arrow"></div>
                <div className="checked-in-popup-content">
                    <div>
                        <div>Not checked in</div> 
                        <button onClick={
                            () => {
                                checkInShift(shift_id);
                                navigate(0);
                            }
                        }>Mark as checked in</button>
                    </div>
                </div>
            </div>);
        } else {
            return (
                <div className="checked-in-popup">
                    <div className="arrow"></div>
                    <div className="checked-in-popup-content">
                        <div>
                            <div>Checked in!</div> 
                        </div>
                    </div>
                </div>);
        }
    };

    const renderVolunteers = () => {
        const volunteers = panelInfo?.schedules.flatMap(
            (schedule) => {
                if (shiftDetails) {
                    if (schedule.start_time === shiftDetails.start_time && schedule.end_time === shiftDetails.end_time) {
                        return schedule.volunteers
                    } else {
                        return []
                    }
                }
                else {
                    return schedule.volunteers
                }
            }     
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
            <div className="class-members">
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
                    <>{renderCheckedInButton(volunteer)}</>
                    
                </div>
            );
            })}
            </div>
        );
    };

    const renderInstructorInfo = () => {
        const instructors = panelInfo?.schedules.map((schedule) => ({
            id: schedule.fk_instructor_id,
            f_name: schedule.instructor_f_name,
            l_name: schedule.instructor_l_name,
            email: schedule.instructor_email
        }));

        // same volunteer may be assigned to multiple schedules within a class
        const uniqueIds = [],
            uniqueInstructors = [];
            instructors?.forEach((instructor) => {
                if (instructor.id && !uniqueIds.includes(instructor.id)) {
                    uniqueIds.push(instructor.id);
                    uniqueInstructors.push(instructor);
                }
        });

        if (!uniqueInstructors || uniqueInstructors.length === 0) {
            return <>No instructors for this class.</>;
        }

        return (
            <div className="class-members">
                {uniqueInstructors.map((instructor, idx) => (
                    <div className="instructor-item" key={idx}>
                        <div>{instructor.f_name + " " + instructor.l_name}</div>
                        <button
                            className="instructor-email"
                            onClick={() => {
                            window.open(`mailto:${instructor.email}`);
                            }}
                        >
                            {instructor.email}
                        </button>
                    </div>
                ))}
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
                    <div className="panel-titles">Instructors</div>
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