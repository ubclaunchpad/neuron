import "./index.css";
import ProfileImg from "../ImgFallback";
import zoom_icon from "../../assets/zoom.png";
import { formatImageUrl } from "../../api/imageService";

function ClassScheduleCard({ panelInfo, schedule, renderInstructorInfo }) {

    const renderVolunteers = () => {
        if (schedule.volunteers.length === 0) {
            return <div style={{
                color: '#808080'
            }}>No volunteers assigned.</div>;
        }
        return (
        <div className="class-volunteers">
            {schedule.volunteers.map((volunteer, idx) => {
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
                    )
            })}
        </div>
        );
    };

    const formatTime = (time) => {
        const [hour, minute] = time.split(":").map(Number);
        const period = hour >= 12 ? "PM" : "AM";
        const formattedHour = hour % 12 || 12;
        return `${formattedHour}:${minute.toString().padStart(2, "0")} ${period}`;
      };

    const dow = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];

    return (
        <div className="class-schedule-card">
            <div className="schedule-header">
                <div className="schedule-header-day">
                    {dow[schedule.day]}
                </div>
                <div className="panel-titles">
                    {formatTime(schedule.start_time)} -{" "}{formatTime(schedule.end_time)}
                </div>
            </div>
            <div className="panel-details-shift">
                <div className="panel-details-shift-row">
                    <div className="panel-titles">Instructor</div>
                    <div className="panel-details-shift-right">
                        {schedule.instructor_f_name && schedule.instructor_l_name ? 
                            schedule.instructor_f_name + " " + schedule.instructor_l_name : 
                            "No instructor assigned."}
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
                            <a href={panelInfo.zoom_link} >
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
            </div>
        </div>
    )
}

export default ClassScheduleCard;