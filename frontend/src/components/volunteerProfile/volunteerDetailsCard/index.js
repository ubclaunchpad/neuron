import React, { useEffect } from "react";
import "./index.css";

import camera_icon from "../../../assets/camera.png";
import cancel_icon from "../../../assets/cancel-icon.png";
import check_icon from "../../../assets/check-icon.png";
import edit_icon from "../../../assets/edit-icon.png";
import ProfileImg from "../../ImgFallback";

import { CgSelect } from "react-icons/cg";
import { formatImageUrl } from "../../../api/imageService";
import { updateVolunteerData, uploadProfilePicture } from "../../../api/volunteerService";
import { useAuth } from "../../../contexts/authContext";
import useComponentVisible from "../../../hooks/useComponentVisible";
import notyf from "../../../utils/notyf";

function VolunteerDetailsCard({ volunteer }) {
    const { user, updateUser } = useAuth();

    const [isEditing, setIsEditing] = React.useState(false);
    const [mutableData, setMutableData] = React.useState({
        profilePicture: volunteer.profile_picture,
        preferredName: volunteer.p_name,
        pronouns: volunteer.pronouns,
        phoneNumber: volunteer.phone_number,
        timeCommitment: volunteer.p_time_ctmt
    });
    const [prevMutableData, setPrevMutableData] = React.useState({});
    const [tempImage, setTempImage] = React.useState(null);
    const [prevTempImage, setPrevTempImage] = React.useState(null);

    const { ref, isComponentVisible, setIsComponentVisible } = useComponentVisible(false);
    const pronouns = ["None", "He/Him", "She/Her", "They/Them"];

    function sendTcNotif() {
        notyf.error("You may want to update your preferred time commitment.");
    }

    useEffect(() => {
        if (Number(mutableData.timeCommitment) <= 0 && !isEditing) {
            sendTcNotif();
        }
    }, [
        mutableData.timeCommitment,
        isEditing
    ]);

    const handleImageUpload = (event) => {
        const image = event.target.files[0];
        const reader = new FileReader();
        reader.onload = () => {
            setTempImage(reader.result);
            setMutableData({
                ...mutableData,
                profilePicture: image
            });
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

    async function handleSaveVolunteer() {
        // only send request if there are changes
        if (mutableData.preferredName !== prevMutableData.preferredName ||
            mutableData.pronouns !== prevMutableData.pronouns ||
            mutableData.phoneNumber !== prevMutableData.phoneNumber ||
            mutableData.timeCommitment !== prevMutableData.timeCommitment) {
                
            // store empty strings as null
            const volunteerData = {
                p_name: mutableData.preferredName ?? undefined,
                pronouns: mutableData.pronouns ?? undefined,
                phone_number: mutableData.phoneNumber ?? undefined,
                p_time_ctmt: mutableData.timeCommitment
            }

            const volunteerResult = await updateVolunteerData(volunteerData, volunteer.volunteer_id);
            console.log("Successfully updated volunteer.", volunteerResult);
        }
    }

    async function handleSavePicture() {
        // only send request if there are changes
        if (mutableData.profilePicture !== prevMutableData.profilePicture) {
            // insert profile picture
            const profilePicData = new FormData();
            profilePicData.append('image', mutableData.profilePicture);

            const uploadedImageId = await uploadProfilePicture(volunteer.fk_user_id, profilePicData);

            mutableData.profilePicture = formatImageUrl(uploadedImageId);
            setTempImage(null);

            if (user.volunteer.volunteer_id === volunteer.volunteer_id) {
                updateUser({
                    ...user,
                    fk_image_id: uploadedImageId
                });
            }
        }
    }

    async function handleCheck(e) {
        e.preventDefault();

        if (Number(mutableData.timeCommitment) < 0) {
            notyf.error("Time commitment cannot be negative");
            return;
        }

        setIsEditing(false);
        mutableData.timeCommitment = Number(mutableData.timeCommitment);
        // update volunteer
        try {
            await handleSaveVolunteer();
            await handleSavePicture();
        } catch (error) {
            console.log(error)
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
        });
    }

    function handlePronounsClick(option) {
        setMutableData({
            ...mutableData,
            pronouns: option === "None" ? null : option
        });
        setIsComponentVisible(false);
    }

    return (
        <div className="profile-card-container">
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
                        <ProfileImg
                            className="profile-image"
                            src={tempImage ?? mutableData.profilePicture}
                            name={mutableData.preferredName || volunteer.f_name}
                        ></ProfileImg>
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
                                            'fontStyle': 'italic'
                                        }}
                                        hidden={isEditing}>
                                            {mutableData.preferredName ?? "not yet set"}
                                    </td>
                                    <td hidden={!isEditing}>
                                        <input type="text" className="text-input" name="preferredName" value={mutableData.preferredName} onChange={handleInputChange}></input>
                                    </td>
                                </tr>
                                <tr className="row-gap"/>
                                <tr className="view volunteer-pronouns">
                                    <td>Pronouns</td>
                                    <td 
                                        className="mutable-value" 
                                        style={mutableData.pronouns ? {} : {
                                            'color': '#808080',
                                            'fontStyle': 'italic'
                                        }}
                                        hidden={isEditing}>
                                            {mutableData.pronouns ?? "not yet set"}
                                    </td>
                                    {isEditing && (
                                        <td 
                                            className="pronouns-editor" 
                                            ref={ref}
                                        >
                                            <button 
                                                className="pronouns-button"
                                                style={{
                                                    'fontFamily': 'var(--font-secondary)',
                                                    'color': mutableData.pronouns ? '':'#808080',
                                                    'borderColor': isComponentVisible ? '#4385AC':''
                                                }}
                                                onClick={() => {
                                                    setIsComponentVisible(!isComponentVisible)
                                                }}
                                            >
                                                {mutableData.pronouns ? mutableData.pronouns : "None"}
                                                <CgSelect className="select-icon"/>
                                            </button>
                                            {isComponentVisible && (
                                                <div 
                                                    className="pronouns-menu"
                                                >
                                                    {pronouns.map((option, index) => (
                                                        <div
                                                            className="pronouns-item"
                                                            key={index}
                                                            onClick={() => handlePronounsClick(option)}
                                                            style={index === 0 ? {'color': '#808080'} : {}}
                                                        >
                                                            {option}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </td>)}
                                </tr>
                                <tr className="row-gap"/>
                                <tr className="view volunteer-time-commitment">
                                    <td>Preferred Time Commitment</td>
                                    <td 
                                        className="mutable-value" 
                                        hidden={isEditing}>
                                            <span className="bold">{mutableData.timeCommitment}</span> hr{mutableData.timeCommitment === 1 ? '':'s'}/week 
                                    </td>
                                    <td hidden={!isEditing}>
                                        <div className="time-commitment-input">
                                            <input 
                                                type="number" 
                                                min={0} 
                                                max={40} 
                                                className="text-input"
                                                name="timeCommitment" 
                                                value={mutableData.timeCommitment} 
                                                onChange={handleInputChange}
                                            />
                                            <div className="time-commitment-units">hrs/week</div>
                                        </div>
                                    </td>
                                </tr>
                                <tr className="row-gap"/>
                                <tr className="view volunteer-phone">
                                    <td>Phone</td>
                                    <td 
                                        className="mutable-value" 
                                        style={mutableData.phoneNumber ? {} : {
                                            'color': '#808080',
                                            'fontStyle': 'italic'
                                        }}
                                        hidden={isEditing}>
                                            {mutableData.phoneNumber ? formatPhone(mutableData.phoneNumber) : "not yet set"}
                                    </td>
                                    <td hidden={!isEditing}>
                                        <input type="number" className="text-input" name="phoneNumber" value={mutableData.phoneNumber} onChange={handleInputChange}></input>
                                    </td>
                                </tr>
                                <tr className="row-gap"/>
                                <tr className="view volunteer-email" hidden={isEditing}>
                                    <td>Email</td>
                                    <td>{volunteer.email}</td>
                                </tr>
                                <tr className="row-gap"/>
                                <tr className="view volunteer-joined-date" hidden={isEditing}>
                                    <td>Joined</td>
                                    <td>{formatDate(volunteer.created_at)}</td>
                                </tr>
                                <tr className="row-gap"/>
                                <tr className="view volunteer-location" hidden={isEditing}>
                                    <td>Location</td>
                                    <td
                                        style={volunteer.city && volunteer.province ? {} : {
                                            'color': '#808080',
                                            'fontStyle': 'italic'
                                        }}
                                    >
                                        {volunteer.city && volunteer.province ? `${volunteer.city}, ${volunteer.province}` : 'not yet set'}
                                    </td>
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