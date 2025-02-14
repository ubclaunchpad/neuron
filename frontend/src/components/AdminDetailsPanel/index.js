import ClassScheduleCard from "../ClassScheduleCard";
import "./index.css";

function AdminDetailsPanel({ panelInfo, renderInstructorInfo, setEditing }) {
    return (
        <div className="panel-details">
            <div className="panel-edit-class">
                <button
                    className="edit-class-button"
                    onClick={() => setEditing(true)}
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
                    panelInfo.schedules.map((schedule) => (
                        <ClassScheduleCard 
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