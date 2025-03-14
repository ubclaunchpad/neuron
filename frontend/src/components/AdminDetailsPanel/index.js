import { useState } from "react";
import ClassScheduleCard from "../ClassScheduleCard";
import "./index.css";
import { deleteClass } from "../../api/classesPageService";
import notyf from "../../utils/notyf";

function AdminDetailsPanel({ 
    classId, 
    panelInfo, 
    navigate, 
    setUpdates, 
    setClassId 
}) {
    const [showPopup, setShowPopup] = useState(false);

    return (
        <div className="panel-details">
            <div className="panel-edit-class">
                <button
                    className="edit-class-button"
                    onClick={() => navigate("/classes?edit=true", { state: { classId } })}
                >
                    Edit Class
                </button>
                <button 
                    className="delete-class-button" 
                    onClick={() => setShowPopup(true)}
                >
                    Delete Class
                </button>
                {showPopup && (
                    <div className="delete-popup-overlay">
                        <div className="delete-popup">
                            <h2 className="delete-popup-title">Delete Class</h2>
                            <p className="delete-popup-prompt">Delete this class permanently?</p>
                            <div className="delete-popup-buttons">
                                <button type="button" className="cancel-delete-button" onClick={() => setShowPopup(false)}>
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="confirm-delete-button"
                                    onClick={() => {
                                        deleteClass(classId)
                                            .then(() => {
                                                notyf.success("Class deleted successfully.");

                                                // collapse the details panel
                                                setClassId(null);

                                                setUpdates((prev) => prev + 1);
                                                setShowPopup(false);
                                            })
                                            .catch((error) => {
                                                console.log(error);
                                                notyf.error("Sorry, an error occurred while deleting the class.");
                                            });
                                    }}
                                >
                                    Delete Class
                                </button>
                            </div>
                        </div>
                    </div>
                )}
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