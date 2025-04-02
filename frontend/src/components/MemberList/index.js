import BorderColorRoundedIcon from '@mui/icons-material/BorderColorRounded';
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatImageUrl } from "../../api/imageService";
import AddEditInstructorModal from "../AddEditInstructorModal";
import ProfileImg from "../ImgFallback";
import Modal from "../Modal";
import "./index.css";

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
                        <ProfileImg src={formatImageUrl(member.fk_image_id)} name={member.f_name}></ProfileImg>
                        <div className="member-details">
                            <div className="member-name">{member.f_name} {member.l_name}</div>
                            <div className="member-email">{member.email}</div>
                        </div>
                        {type === "volunteers" && (
                            <div className="member-badges">
                                {member.status === 'active' ? 
                                    <span className={`badge badge-status active`}>Active</span>
                                : null}
                                {member.status === 'inactive' ? 
                                    <span className={`badge badge-status inactive`}>Inactive</span>
                                : null}
                                {member.status === 'unverified' ? 
                                    <span className={`badge badge-status unverified`}>Unverified</span>
                                : null}
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