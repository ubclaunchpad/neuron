import "./index.css"
import { useNavigate } from "react-router-dom"

const VolunteerList = ({volunteers}) => {
    const navigate = useNavigate();

    return (
        <div className="volunteer-list">
            {volunteers.length > 0 && volunteers.map((member) => (
                <div key={member.volunteer_id} className="member-card" onClick={() => {
                    navigate(`/volunteer-profile?volunteer_id=${member.volunteer_id}`)
                }}>
                    <div className="member-info">
                        <div className="avatar" style={{backgroundImage: member.fk_image_id !== undefined ? `url(http://localhost:3001/image/${member.fk_image_id})` : `url('https://api.dicebear.com/9.x/initials/svg?seed=${member.f_name}+${member.l_name}')`}}>
                        </div>
                        <div className="member-details">
                            <div className="member-name">{member.f_name} {member.l_name}</div>
                            <div className="member-email">{member.email}</div>
                        </div>
                        <div className="member-badges">
                            <span className={`badge badge-status ${member.active === 1 ? 'active' : 'inactive'}`}>{member.active === 1 ? 'Active' : 'Inactive'}</span>
                            <span className={`badge badge-role regular-volunteer`}>Regular Volunteer</span>
                        </div>
                        <div className="right-arrow-icon"></div>
                    </div>
                </div>
            ))}
            {volunteers.length === 0 && (
                <div className="no-volunteers">No volunteers found</div>
            )}
        </div>
    )
}

export default VolunteerList