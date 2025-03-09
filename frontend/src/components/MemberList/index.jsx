import "./index.css";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import BorderColorRoundedIcon from '@mui/icons-material/BorderColorRounded';
import Modal from "../Modal";
import AddEditInstructorModal from "../AddEditInstructorModal";

const MemberList = ({data, fetchData, type}) => {
    const navigate = useNavigate();
    const [editInstructorModal, setEditInstructorModal] = useState(false);
    const [selectedInstructor, setSelectedInstructor] = useState(null);

    return (
        <div className="volunteer-list">
            {data.length > 0 && data.map((member) => (
                <div key={type === "volunteers" ? member.volunteer_id : member.instructor_id} className={type === "volunteers" ? "member-card volunteer-card" : "member-card"} onClick={() => {
                    if (type === "volunteers") {
                        navigate(`/volunteer-profile?volunteer_id=${member.volunteer_id}`);
                    } else if (type === "instructors") {
                        return;
                    }
                }}>
                    <div className="member-info">
                        <div className="avatar" style={{backgroundImage: member.fk_image_id !== undefined ? `url(http://localhost:3001/image/${member.fk_image_id})` : `url('https://api.dicebear.com/9.x/initials/svg?seed=${member.f_name}+${member.l_name}')`}}>
                        </div>
                        <div className="member-details">
                            <div className="member-name">{member.f_name} {member.l_name}</div>
                            <div className="member-email">{member.email}</div>
                        </div>
                        {type === "volunteers" && (
                            <div className="member-badges">
                                <span className={`badge badge-status ${member.active === 1 ? 'active' : 'inactive'}`}>{member.active === 1 ? 'Active' : 'Inactive'}</span>
                                <span className={`badge badge-role regular-volunteer`}>Regular Volunteer</span>
                            </div>
                        )}
                        {type === "volunteers" && (<div className="right-arrow-icon"></div>)}
                        {type === "instructors" && (
                            <div onClick={() => {
                                setSelectedInstructor(member)
                                setEditInstructorModal(true)
                            }}>
                                <BorderColorRoundedIcon fontSize="small" sx={{color: "#808080", paddingRight: "15px", cursor: "pointer"}} />
                            </div>
                        )}
                    </div>
                </div>
            ))}
            {data.length === 0 && (
                <div className="no-volunteers">No {type} found</div>
            )}

        <Modal title="Edit instructor details" isOpen={editInstructorModal} onClose={() => setEditInstructorModal(false)} width="500px" height="fit-content">
            <AddEditInstructorModal closeEvent={() => {
                setEditInstructorModal(false);
                fetchData();
            }} instructor_data={selectedInstructor} />
        </Modal>
        </div>
    )
}

export default MemberList;