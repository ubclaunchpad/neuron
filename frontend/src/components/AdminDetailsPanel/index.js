import ClassScheduleCard from "../ClassScheduleCard";
import "./index.css";

function AdminDetailsPanel({ panelInfo, renderInstructorInfo, navigate }) {

    return (
        <div className="panel-details">
            <div className="panel-edit-class">
                <button
                    className="edit-class-button"
                    onClick={() => navigate("/classes?edit=true")}
                >
                    Edit Class
                </button>
            </div>
            <div className="panel-details-description">
                <div className="panel-titles">Description</div>
                <div className="panel-description">
                    {panelInfo?.instructions || "No instructions available"}
                </div>
            </div>
            <div className="panel-schedules">
                {panelInfo?.schedules.length > 0 ? 
                    panelInfo.schedules.map((schedule, index) => (
                        <ClassScheduleCard 
                            key={index}
                            panelInfo={panelInfo} 
                            schedule={schedule}
                            renderInstructorInfo={renderInstructorInfo} 
                        />
                    )) :
                    (
                        <div className="panel-no-schedules">
                            No current schedules for this class.
                        </div>
                    )
                }
            </div>
        </div>
    )
}

export default AdminDetailsPanel;