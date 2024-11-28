import "./index.css";
import React from "react";

import edit_icon from "../../../assets/edit-icon.png"
import check_icon from "../../../assets/check-icon.png";
import cancel_icon from "../../../assets/cancel-icon.png"
import empty_profile from "../../../assets/empty-profile.png"
import camera_icon from "../../../assets/camera.png"

import { updateVolunteerData, updateProfilePicture, insertProfilePicture } from "../../../api/volunteerService";

function VolunteerDetailsCard({ volunteer }) {

    const [isEditing, setIsEditing] = React.useState(false);
    const [mutableData, setMutableData] = React.useState({
        profilePicture: volunteer.profile_picture,
        preferredName: volunteer.p_name,
        pronouns: volunteer.pronouns,
        phoneNumber: volunteer.phone_number
    });
    const [prevMutableData, setPrevMutableData] = React.useState({
        profilePicture: null,
        preferredName: null,
        pronouns: null,
        phoneNumber: null
    });
    const [tempImage, setTempImage] = React.useState(null);
    const [prevTempImage, setPrevTempImage] = React.useState(null);

    const handleImageUpload = (event) => {
        const image = event.target.files[0];
        setMutableData({
            ...mutableData,
            profilePicture: image
        });
        const reader = new FileReader();
        reader.onload = () => {
            setTempImage(reader.result);
        };
        reader.readAsDataURL(image);
    };


    function formatDate(created_at) {
        const date = new Date(created_at);
        return new Intl.DateTimeFormat('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        }).format(date);
    }

    function formatPhone(phoneNumber) {
        return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6)}`;
    }

    function handleEdit(e) {
        e.preventDefault();
        setIsEditing(true);
        setPrevMutableData(mutableData);
        setPrevTempImage(tempImage);
    }

    async function handleCheck(e) {
        e.preventDefault();
        setIsEditing(false);

        // update volunteer
        try {

            // only send request if there are changes
            if (mutableData.preferredName !== prevMutableData.preferredName ||
                mutableData.pronouns !== prevMutableData.pronouns ||
                mutableData.phoneNumber !== prevMutableData.phoneNumber) {
                    
                // store empty strings as null
                const userData = {
                    ...volunteer,
                    p_name: mutableData.preferredName ? mutableData.preferredName : null,
                    pronouns: mutableData.pronouns ? mutableData.pronouns : null,
                    phone_number: mutableData.phoneNumber ? mutableData.phoneNumber : null
                }

                // NOTE: created_at and profile_picture are not fields in volunteers table, need to be seperated
                const {created_at, profile_picture, ...volunteerData} = userData;

                const volunteerResult = await updateVolunteerData(volunteerData);
                console.log("Successfully updated volunteer.", volunteerResult);
            }

            // only send request if there are changes
            if (mutableData.profilePicture !== prevMutableData.profilePicture) {
                // insert profile picture
                const profilePicData = new FormData();
                profilePicData.append('image', mutableData.profilePicture);

                // if no existing profile picture
                if (prevMutableData.profilePicture === null) { 

                    // attach id to req body
                    profilePicData.append('volunteer_id', volunteer.volunteer_id);

                    const profilePicResult = await insertProfilePicture(profilePicData);
                    console.log("Successfully inserted profile picture.", profilePicResult);
                } else {
                    const profilePicResult = await updateProfilePicture(volunteer.volunteer_id, profilePicData);
                    console.log("Successfully updated profile picture.", profilePicResult);
                }
            }
            
        } catch (error) {
            setMutableData(prevMutableData);
            setTempImage(prevTempImage);
        }
    }

    function handleCancel(e) {
        e.preventDefault();
        setIsEditing(false);
        setMutableData(prevMutableData);
        setTempImage(prevTempImage);
    }

    function handleInputChange(e) {
        const { name, value } = e.target;
        setMutableData({
            ...mutableData,
            [name]: value
        })
    }

    return (
        <div className="profile-card">
            <img className="icon edit-icon" src={edit_icon} alt="Edit" hidden={isEditing} onClick={handleEdit}/>
            <div className="edit-options"> 
                <img className="icon check-icon" src={check_icon} alt="Check" hidden={!isEditing} onClick={handleCheck}/>          
                <img className="icon cancel-icon" src={cancel_icon} alt="Cancel" hidden={!isEditing} onClick={handleCancel}/>
            </div>
            <div className="profile-content">
                <div 
                    className="profile-picture-form"
                    style={{
                        cursor: isEditing ? 'pointer' : 'default'
                    }}
                    onClick={() => {
                        if (isEditing) 
                            document.getElementById('fileInput').click()
                    }}
                >
                    <img src={tempImage ? tempImage : mutableData.profilePicture ? mutableData.profilePicture : empty_profile} alt="Profile" className="profile-image"/>
                    {isEditing && <div className="overlay">
                        <img src={camera_icon} alt="Edit Profile" className="camera-icon" />
                        <p className="edit-text">Edit</p>
                    </div>}
                    {isEditing && <input
                        className="file-input"
                        id="fileInput" 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload} 
                    />}
                    
                </div>
                <div className="profile-info">
                    <div className="header">
                        <h2>{volunteer.f_name} {volunteer.l_name}</h2>
                    </div>
                    <table className="profile-table">
                        <tbody>
                            <tr className="view volunteer-preferred-name">
                                <td>Preferred Name</td>
                                <td 
                                    className="mutable-value" 
                                    style={mutableData.preferredName ? {} : {
                                        'color': '#808080',
                                        'font-style': 'italic'
                                    }}
                                    hidden={isEditing}>
                                        {mutableData.preferredName ? mutableData.preferredName : "not yet set"}
                                </td>
                                <td hidden={!isEditing}>
                                    <input type="text" className="text-input" placeholder="Enter your preferred name" name="preferredName" value={mutableData.preferredName} onChange={handleInputChange}></input>
                                </td>
                            </tr>
                            <tr className="view volunteer-pronouns">
                                <td>Pronouns</td>
                                <td 
                                    className="mutable-value" 
                                    style={mutableData.pronouns ? {} : {
                                        'color': '#808080',
                                        'font-style': 'italic'
                                    }}
                                    hidden={isEditing}>
                                        {mutableData.pronouns ? mutableData.pronouns : "not yet set"}
                                </td>
                                <td className="pronouns-editor" hidden={!isEditing}>
                                    <select 
                                        className="pronouns-input" 
                                        placeholder="Enter your pronouns" 
                                        name="pronouns"
                                        value={mutableData.pronouns} 
                                        onChange={handleInputChange}
                                    >
                                        <option className="pronouns-none" value="">select</option>
                                        <option className="pronouns-option" value="He/Him">He/Him</option>
                                        <option className="pronouns-option" value="She/Her">She/Her</option>
                                        <option className="pronouns-option" value="They/Them">They/Them</option>
                                    </select>
                                </td>
                            </tr>
                            <tr className="view volunteer-phone">
                                <td>Phone</td>
                                <td 
                                    className="mutable-value" 
                                    style={mutableData.phoneNumber ? {} : {
                                        'color': '#808080',
                                        'font-style': 'italic'
                                    }}
                                    hidden={isEditing}>
                                        {mutableData.phoneNumber ? formatPhone(mutableData.phoneNumber) : "not yet set"}
                                </td>
                                <td hidden={!isEditing}>
                                    <input type="text" className="text-input" placeholder="Enter your phone number" name="phoneNumber" maxLength={10} value={mutableData.phoneNumber} onChange={handleInputChange}></input>
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
                                <td>{volunteer.city}, {volunteer.province}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      );
}

export default VolunteerDetailsCard;