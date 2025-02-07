import { useEffect, useState } from "react";
import { useEffect, useState } from "react";
import "./index.css";

import camera_icon from "../../../assets/camera.png";
import cancel_icon from "../../../assets/cancel-icon.png";
import check_icon from "../../../assets/check-icon.png";
import edit_icon from "../../../assets/edit-icon.png";
import ProfileImg from "../../ImgFallback";

import { CgSelect } from "react-icons/cg";
import { formatImageUrl } from "../../../api/imageService";
import { updateVolunteerData, uploadProfilePicture } from "../../../api/volunteerService";
import useComponentVisible from "../../../hooks/useComponentVisible";
import {State, City} from 'country-state-city';
import notyf from "../../../utils/notyf";

function VolunteerDetailsCard({ volunteer }) {
    const [isEditing, setIsEditing] = useState(false);
    const [mutableData, setMutableData] = useState({
        profilePicture: volunteer.profile_picture,
        preferredName: volunteer.p_name,
        pronouns: volunteer.pronouns,
        phoneNumber: volunteer.phone_number,
        city: volunteer.city,
        province: volunteer.province
    });
    const [prevMutableData, setPrevMutableData] = useState({});
    const [tempImage, setTempImage] = useState(null);
    const [prevTempImage, setPrevTempImage] = useState(null);
    const provinces = [{isoCode: "None"}].concat(State.getStatesOfCountry('CA'));
    const [selectedProvince, setSelectedProvince] = useState("BC");
    const [cities, setCities] = useState(City.getCitiesOfState('CA', selectedProvince));

    const { ref, isComponentVisible, setIsComponentVisible } = useComponentVisible(false);
    const { ref: provinceRef, isComponentVisible: isProvinceVisible, setIsComponentVisible: setisProvinceVisible } = useComponentVisible(false);
    const { ref: cityRef, isComponentVisible: isCityVisible, setIsComponentVisible: setisCityVisible } = useComponentVisible(false);
    const pronouns = ["None", "He/Him", "She/Her", "They/Them"];

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

    useEffect(() => {
        setCities([{name: "None"}].concat(City.getCitiesOfState('CA', selectedProvince)));
    }, [selectedProvince]);


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
                mutableData.phoneNumber !== prevMutableData.phoneNumber ||
                mutableData.city !== prevMutableData.city ||
                mutableData.province !== prevMutableData.province) {
                    
                // store empty strings as null
                const volunteerData = {
                    p_name: mutableData.preferredName,
                    pronouns: mutableData.pronouns,
                    phone_number: mutableData.phoneNumber,
                    city: mutableData.city === "None" ? "" : mutableData.city,
                    province: mutableData.province === "None" ? "" : mutableData.province
                }

                const volunteerResult = await updateVolunteerData(volunteerData, volunteer.volunteer_id);
                console.log("Successfully updated volunteer.", volunteerResult);
                notyf.success("Data Updated! Please refresh the page to see changes.");
            }

            // only send request if there are changes
            if (mutableData.profilePicture !== prevMutableData.profilePicture) {
                // insert profile picture
                const profilePicData = new FormData();
                profilePicData.append('image', mutableData.profilePicture);

                // attach id to req body
                profilePicData.append('volunteer_id', volunteer.volunteer_id);

                const uploadedImageId = await uploadProfilePicture(volunteer.fk_user_id, profilePicData);

                setTempImage(formatImageUrl(uploadedImageId));
            }
            
        } catch (error) {
            console.log(error)
            setMutableData(prevMutableData);
            setTempImage(prevTempImage);
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
            // only send request if there are changes
            if (mutableData.preferredName !== prevMutableData.preferredName ||
                mutableData.pronouns !== prevMutableData.pronouns ||
                mutableData.phoneNumber !== prevMutableData.phoneNumber ||
                mutableData.city !== prevMutableData.city ||
                mutableData.province !== prevMutableData.province) {
                    
                // store empty strings as null
                const volunteerData = {
                    p_name: mutableData.preferredName,
                    pronouns: mutableData.pronouns,
                    phone_number: mutableData.phoneNumber,
                    city: mutableData.city === "None" ? "" : mutableData.city,
                    province: mutableData.province === "None" ? "" : mutableData.province
                }

                const volunteerResult = await updateVolunteerData(volunteerData, volunteer.volunteer_id);
                console.log("Successfully updated volunteer.", volunteerResult);
                notyf.success("Data Updated! Please refresh the page to see changes.");
            }

            // only send request if there are changes
            if (mutableData.profilePicture !== prevMutableData.profilePicture) {
                // insert profile picture
                const profilePicData = new FormData();
                profilePicData.append('image', mutableData.profilePicture);

                // attach id to req body
                profilePicData.append('volunteer_id', volunteer.volunteer_id);

                const uploadedImageId = await uploadProfilePicture(volunteer.fk_user_id, profilePicData);

                setTempImage(formatImageUrl(uploadedImageId));
            }
            
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

    function handleProvinceClick(option) {
        setSelectedProvince(option.isoCode);
        setMutableData({
            ...mutableData,
            province: option === "None" ? null : option.isoCode
        });
        setisProvinceVisible(false);
    }

    function handleCityClick(option) {
        setMutableData({
            ...mutableData,
            city: option === "None" ? null : option.name
        });
        setisCityVisible(false);
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
                                            'font-style': 'italic'
                                        }}
                                        hidden={isEditing}>
                                            {mutableData.preferredName ?? "not yet set"}
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
                                        <input type="number" className="text-input" placeholder="Enter your phone number" name="phoneNumber" value={mutableData.phoneNumber} onChange={handleInputChange}></input>
                                    </td>
                                </tr>
                                <tr className="view volunteer-email" hidden={isEditing}>
                                    <td>Email</td>
                                    <td>{volunteer.email}</td>
                                </tr>
                                <tr className="view volunteer-joined-date" hidden={isEditing}>
                                    <td>Joined</td>
                                    <td>{formatDate(volunteer.created_at)}</td>
                                </tr>
                                <tr className="view volunteer-location">
                                    <td hidden={isEditing}>Location</td>
                                    <td hidden={isEditing}>{volunteer.city && volunteer.province ? `${volunteer.city}, ${volunteer.province}` : 'No Location Set'}</td>
                                    {isEditing && (
                                        <>
                                            <td style={{
                                                'color': '#808080'
                                            }}>Province</td>
                                            <td 
                                                className="pronouns-editor" 
                                                ref={provinceRef}
                                            >
                                                <button 
                                                    className="pronouns-button"
                                                    style={{
                                                        'color': mutableData.province ? '':'#808080',
                                                        'borderColor': isProvinceVisible ? '#4385AC':''
                                                    }}
                                                    onClick={() => {
                                                        setisProvinceVisible(!isProvinceVisible)
                                                    }}
                                                >
                                                    {mutableData.province ? mutableData.province : "None"}
                                                    <CgSelect className="select-icon"/>
                                                </button>
                                                {isProvinceVisible && (
                                                    <div 
                                                        className="pronouns-menu"
                                                    >
                                                        {provinces.map((option, index) => (
                                                            <div
                                                                className="pronouns-item"
                                                                key={index}
                                                                onClick={() => handleProvinceClick(option)}
                                                                style={index === 0 ? {'color': '#808080'} : {}}
                                                            >
                                                                {option.isoCode}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>
                                        </>
                                    )}
                                </tr>
                                <tr hidden={!isEditing}>
                                    <td>City</td>
                                    <td 
                                    className="pronouns-editor" 
                                    ref={cityRef}
                                    >
                                    <button 
                                        className="pronouns-button"
                                        style={{
                                            'color': mutableData.city ? '':'#808080',
                                            'borderColor': isCityVisible ? '#4385AC':''
                                        }}
                                        onClick={() => {
                                            setisCityVisible(!isCityVisible)
                                        }}
                                    >
                                        {mutableData.city ? mutableData.city : "None"}
                                        <CgSelect className="select-icon"/>
                                    </button>
                                    {isCityVisible && (
                                        <div 
                                            className="pronouns-menu cities-menu"
                                        >
                                            {cities.map((option, index) => (
                                                <div
                                                    className="pronouns-item"
                                                    key={index}
                                                    onClick={() => handleCityClick(option)}
                                                    style={index === 0 ? {'color': '#808080'} : {}}
                                                >
                                                    {option.name}
                                                </div>
                                            ))}
                                        </div>
                                    )}
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