import "./index.css";
import React from "react";

import edit_icon from "../../../assets/edit-icon.png"
import check_icon from "../../../assets/check-icon.png";
import cancel_icon from "../../../assets/cancel-icon.png"

function VolunteerDetailsCard({ volunteer }) {

    const [isEditing, setIsEditing] = React.useState(false);
    const [preferredName, setPreferredName] = React.useState(null);
    const [prevPreferredName, setPrevPreferredName] = React.useState(null);


    function formatDate(created_at) {
        const date = new Date(created_at);
        return new Intl.DateTimeFormat('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        }).format(date);
    }

    function handleEdit(e) {
        e.preventDefault();
        setIsEditing(true);
        setPrevPreferredName(preferredName);
    }

    function handleCheck(e) {
        e.preventDefault();
        setIsEditing(false);
    }

    function handleCancel(e) {
        e.preventDefault();
        setIsEditing(false);
        setPreferredName(prevPreferredName);
    }

    function handleInputChange(e) {
        setPreferredName(e.target.value);
    }

    if (!volunteer) {
        return <div>Loading...</div>;
    }
    return (
        <div className="profile-card">
            <img className="icon edit-icon" src={edit_icon} alt="Edit" hidden={isEditing} onClick={handleEdit}/>
            <div className="edit-options"> 
                <img className="icon check-icon" src={check_icon} alt="Check" hidden={!isEditing} onClick={handleCheck}/>          
                <img className="icon cancel-icon" src={cancel_icon} alt="Cancel" hidden={!isEditing} onClick={handleCancel}/>
            </div>
            <div className="profile-content-container">
                <div className="profile-content">
                    <img src="https://avatars.githubusercontent.com/u/124746110?v=4" alt="Profile" className="profile-image" />
                    <div className="profile-info">
                        <div className="header">
                            <h2>{volunteer.f_name} {volunteer.l_name}</h2>
                        </div>
                        <table className="profile-table">
                            <tbody>
                                <tr className="view volunteer-preferred-name">
                                    <td>Preferred Name</td>
                                    <td className="volunteer-pn-value" hidden={isEditing}>{preferredName ? preferredName : "not yet set"}</td>

                                </tr>
                                <tr className="view volunteer-preferred-name-input" hidden={!isEditing}>
                                    <td colSpan={2}>
                                        <input type="text" className="pn-input" placeholder="Enter your preferred name" value={preferredName} onChange={handleInputChange}></input>
                                    </td>
                                </tr>
                                <tr className="view volunteer-email">
                                    <td>Email</td>
                                    <td>{volunteer.email}</td>
                                </tr>
                                <tr className="view volunteer-joined-date">
                                    <td>Joined</td>
                                    <td>{formatDate(volunteer.created_at)}</td>
                                </tr>
                                <tr className="view volunteer-location">
                                    <td>Location</td>
                                    <td>Vancouver, BC</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
      );
}

export default VolunteerDetailsCard;