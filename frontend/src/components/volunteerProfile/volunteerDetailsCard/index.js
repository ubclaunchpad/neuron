import { useEffect, useState } from "react";
import "./index.css";

import camera_icon from "../../../assets/camera.png";
import cancel_icon from "../../../assets/cancel-icon.png";
import check_icon from "../../../assets/check-icon.png";
import edit_icon from "../../../assets/edit-icon.png";
import settings_icon from "../../../assets/settings-icon.png";
import ProfileImg from "../../ImgFallback";

import { City, State } from 'country-state-city';
import { Formik } from "formik";
import { CgSelect } from "react-icons/cg";
import Select from 'react-select';
import * as Yup from "yup";
import { updateVolunteerData, uploadProfilePicture } from "../../../api/volunteerService";
import { useAuth } from "../../../contexts/authContext";
import notyf from "../../../utils/notyf";
import DeactivateReactivateModal from "../../Deactivate-Reactivate-Modal";
import Modal from "../../Modal";

const phoneRegex = /^[0-9]{10}$/;

const VolunteerSchema = Yup.object().shape({
    p_name: Yup.string()
        .max(45, 'Preferred name cannot exceed 45 characters.')
        .optional(),
    pronouns: Yup.string()
        .nullable()
        .optional(),
    phone_number: Yup.string()
        .matches(phoneRegex, "Phone number must be 10 digits.")
        .optional(),
    city: Yup.string()
        .nullable()
        .optional(),
    province: Yup.string()
        .nullable()
        .optional(),
    p_time_ctmt: Yup.number()
        .min(0, "Preferred time commitment can not be negative.")
        .optional(),
});

function VolunteerDetailsCard({ volunteer, type = "" }) {

    const { user, updateUser, isAdmin } = useAuth();

    const [isEditing, setIsEditing] = useState(false);
    const [mutableData, setMutableData] = useState({
        p_name: volunteer.p_name,
        pronouns: volunteer.pronouns,
        phone_number: volunteer.phone_number,
        city: volunteer.city,
        province: volunteer.province,
        p_time_ctmt: volunteer.p_time_ctmt
    });
    const [prevMutableData, setPrevMutableData] = useState({});
    const [tempImage, setTempImage] = useState({
        src: volunteer.profile_picture
    });
    const [prevTempImage, setPrevTempImage] = useState(null);
    const provinces = [{value: null, label: "None"}].concat(State.getStatesOfCountry('CA').map((state) => {
        return {value: state.isoCode, label: state.isoCode};
    }));
    const [selectedProvince, setSelectedProvince] = useState(volunteer.province ?? "BC");
    const [cities, setCities] = useState([{value: null, label: "None"}].concat(City.getCitiesOfState('CA', selectedProvince).map((city) => {
        return {value: city.name, label: city.name};
    })));
    const [showAdminMenu, setShowAdminMenu] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const pronounOptions = [
        { value: null, label: "None" },
        { value: "He/Him", label: "He/Him" },
        { value: "She/Her", label: "She/Her" },
        { value: "They/Them", label: "They/Them" },
    ];

    function sendTcNotif() {
        notyf.open({
            type: 'warning',
            message: 'Please set Preferred Time Commitment to a value greater than 0.',
            background: '#FFC107',
            duration: 5000,
            dismissible: true,
        });
    }

    useEffect(() => {
        if (!isAdmin) {
            if (Number(mutableData.p_time_ctmt) <= 0 && !isEditing) {
                sendTcNotif();
            }
        }
    }, [
        mutableData.p_time_ctmt,
        isEditing,
        isAdmin
    ]);

    useEffect(() => {
        setCities([{value: null, label: "None"}].concat(City.getCitiesOfState('CA', selectedProvince).map((city) => {
            return {value: city.name, label: city.name};
        })));
    }, [selectedProvince]);

    useEffect(() => {
        console.log("USER:", user);
    }, [user]);


    function formatDate(created_at) {
        const date = new Date(created_at);
        return new Intl.DateTimeFormat('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        }).format(date);
    }

    function formatPhone(phone_number) {
        phone_number = String(phone_number);
        return `(${phone_number.slice(0, 3)}) ${phone_number.slice(3, 6)}-${phone_number.slice(6)}`;
    }

    function handleEdit(e) {
        e.preventDefault();
        setIsEditing(true);
        setPrevMutableData(mutableData);
        setPrevTempImage(tempImage);
    }

    function handleSave(values) {
        const requests = [];
        requests.push(handleSaveVolunteer(values));
        requests.push(handleSavePicture());
        Promise.all(requests)
            .then(() => {
                setIsEditing(false);
                notyf.success("Successfully updated profile.");
            })
            .catch((error) => {
                console.log(error);
                notyf.error("Failed to update profile.");
            });
    }

    async function handleSaveVolunteer(values) {
        console.log("Updating volunteer...", values);
        setMutableData(values);
        await updateVolunteerData(values, volunteer.volunteer_id);
        updateUser({
            ...user,
            volunteer: {
                ...volunteer,
                ...values
            }
        });
    }

    async function handleSavePicture() {
        // insert profile picture
        if (tempImage && tempImage.blob) {
            console.log("Updating profile picture...", tempImage);
            const profilePicData = new FormData();
            profilePicData.append('image', tempImage.blob);

            const uploadedImageId = await uploadProfilePicture(volunteer.fk_user_id, profilePicData);
            updateUser({
                ...user,
                fk_image_id: uploadedImageId
            });
        }
    }

    function handleCancel(e) {
        e.preventDefault();
        setIsEditing(false);
        setMutableData(prevMutableData);
        setTempImage(prevTempImage);
    }

    return (
        <div className="profile-card-container">
        <Formik
            initialValues={mutableData}
            validationSchema={VolunteerSchema}
            onSubmit={values => handleSave(values)}
        >
            {({
                values,
                errors,
                touched,
                handleChange,
                handleBlur,
                handleSubmit,
                setFieldValue,
                resetForm
            }) => (
                <form className="form-body">
                    <div className="profile-card">
                        {type !== "admin" && 
                            <>
                                <img 
                                    className="icon edit-icon" 
                                    src={edit_icon} alt="Edit" 
                                    hidden={isEditing} 
                                    onClick={handleEdit}
                                />
                                <div className="edit-options"> 
                                    <img 
                                        className="icon check-icon" 
                                        src={check_icon} 
                                        alt="Check" 
                                        hidden={!isEditing} 
                                        onClick={handleSubmit}
                                    />          
                                    <img 
                                        className="icon cancel-icon" 
                                        src={cancel_icon} 
                                        alt="Cancel" 
                                        hidden={!isEditing} 
                                        onClick={(e) => {
                                            handleCancel(e);
                                            resetForm({ values: prevMutableData });
                                        }}
                                    />
                                </div>
                            </>
                        }
                        {type === "admin" && <>
                            <img className="icon edit-icon" src={settings_icon} alt="Settings" onClick={() => {
                                setShowAdminMenu(!showAdminMenu);
                            }}></img>
                            <Modal title={volunteer.active === 1 ? "Deactivate account" : "Reactivate account"} isOpen={showModal} onClose={() => {setShowModal(false)}} children={"hello"} width={"500px"} height={"fit-content"}>
                                <DeactivateReactivateModal id={volunteer.volunteer_id} type={volunteer.active} />
                            </Modal>
                        </>
                        }
                        {showAdminMenu && 
                            <div className="admin-menu">
                                <div className="admin-menu-item" onClick={() => {
                                    setShowModal(true);
                                }}><div className={volunteer.active === 1 ? "deactivate" : "reactivate"}></div><p>{volunteer.active === 1 ? "Deactivate" : "Reactivate"} account</p></div>
                                <div className="admin-menu-item"><div className="edit-email"></div><p>Edit volunteer email</p></div>
                            </div>
                        }
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
                                    src={tempImage.src}
                                    name={mutableData.p_name || volunteer.f_name}
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
                                    onChange={(event) => {
                                        const targetImage = event.target.files[0];
                                        if (targetImage) {
                                            const reader = new FileReader();
                                            reader.onload = () => {
                                                setTempImage({
                                                    src: reader.result,
                                                    blob: targetImage
                                                });
                                            };
                                            reader.readAsDataURL(targetImage);
                                        }
                                    }}  
                                />}
                                
                            </div>
                            <div className="profile-details-form">
                                <div className="header">
                                    <h2 className="profile-title">{volunteer.f_name} {volunteer.l_name}</h2>
                                </div>
                                <table className="profile-table">
                                    <tbody className="profile-tbody">
                                        <tr className="profile-row">
                                            <td>Preferred Name</td>
                                            <td 
                                                className="mutable-value" 
                                                style={mutableData.p_name ? {} : {
                                                    'color': '#808080',
                                                    'fontStyle': 'italic'
                                                }}
                                                hidden={isEditing}>
                                                    {mutableData.p_name ?? "not yet set"}
                                            </td>
                                            <td hidden={!isEditing}>
                                                <input 
                                                    type="text" 
                                                    className="text-input" 
                                                    name="p_name"
                                                    placeholder="Preferred Name"
                                                    value={values.p_name} 
                                                    onChange={handleChange} 
                                                    onBlur={handleBlur}
                                                    errors={errors}
                                                    touched={touched}
                                                />
                                            </td>
                                        </tr>
                                        <tr className="profile-row">
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
                                                >
                                                    <Select
                                                        className="volunteer-select"
                                                        label="Pronouns"
                                                        defaultValue={values.pronouns ? 
                                                            { value: values.pronouns, label: values.pronouns } :
                                                            pronounOptions[0] // none
                                                        }
                                                        styles={{
                                                            control: () => ({
                                                                padding: '8px 26px 8px 10px',
                                                                borderRadius: '4px',
                                                                border: '1px solid #cccccc',
                                                                cursor: 'pointer'
                                                            }),
                                                            valueContainer: (styles) => ({
                                                                ...styles,
                                                                padding: '0px'
                                                            }), 
                                                            singleValue: (styles) => ({
                                                                ...styles,
                                                                color: values.pronouns ? 'default' : '#808080' 
                                                            })
                                                        }}
                                                        options={pronounOptions}
                                                        isSearchable={false}
                                                        components={
                                                            {
                                                                DropdownIndicator: () => 
                                                                    <CgSelect className="volunteer-select-dropdown-icon"/>,
                                                                IndicatorSeparator: () => null,
                                                                Option: (props) => {
                                                                    const {innerProps, innerRef} = props;
                                                                    return (
                                                                        <div {...innerProps} ref={innerRef} className="volunteer-select-item">
                                                                            {props.data.label}
                                                                        </div>
                                                                    )
                                                                },
                                                                Menu: (props) => {
                                                                    const {innerProps, innerRef} = props;
                                                                    return (
                                                                        <div {...innerProps} ref={innerRef}
                                                                        className="volunteer-select-menu">
                                                                            {props.children}
                                                                        </div>
                                                                    )
                                                                }
                                                            }
                                                        }
                                                        onChange={(e) => {
                                                            setFieldValue("pronouns", e.value);
                                                        }}
                                                    />
                                                </td>
                                            )}
                                        </tr>
                                        <tr className="profile-row">
                                            <td>Preferred Time Commitment</td>
                                            <td 
                                                className="mutable-value" 
                                                hidden={isEditing}>
                                                    {mutableData.p_time_ctmt} hr{mutableData.p_time_ctmt === 1 ? '':'s'}/week 
                                            </td>
                                            <td hidden={!isEditing}>
                                                <div className="time-commitment-input">
                                                    <input 
                                                        type="number" 
                                                        min={0} 
                                                        max={40} 
                                                        className="text-input"
                                                        name="p_time_ctmt" 
                                                        value={values.p_time_ctmt} 
                                                        onChange={handleChange}
                                                        onBlur={handleBlur}
                                                        errors={errors}
                                                        touched={touched}
                                                    />
                                                    <div className="time-commitment-units">hrs/week</div>
                                                </div>
                                            </td>
                                        </tr>
                                        <tr className="profile-row">
                                            <td>Phone</td>
                                            <td 
                                                className="mutable-value" 
                                                style={mutableData.phone_number ? {} : {
                                                    'color': '#808080',
                                                    'fontStyle': 'italic'
                                                }}
                                                hidden={isEditing}>
                                                    {mutableData.phone_number ? formatPhone(mutableData.phone_number) : "not yet set"}
                                            </td>
                                            <td hidden={!isEditing}>
                                                <input 
                                                    type="number" 
                                                    className="text-input"
                                                    name="phone_number" 
                                                    placeholder="1234567890"
                                                    value={values.phone_number} 
                                                    onChange={handleChange}
                                                    onBlur={handleBlur}
                                                    errors={errors}
                                                    touched={touched}
                                                />
                                            </td>
                                        </tr>
                                        <tr className="profile-row" hidden={isEditing}>
                                            <td>Email</td>
                                            <td>{volunteer.email}</td>
                                        </tr>
                                        <tr className="profile-row" hidden={isEditing}>
                                            <td>Joined</td>
                                            <td>{formatDate(volunteer.created_at)}</td>
                                        </tr>
                                        <tr className="profile-row">
                                            <td hidden={isEditing}>Location</td>
                                            <td 
                                                hidden={isEditing}
                                                style={mutableData.city && mutableData.province ? {} : {
                                                    'color': '#808080',
                                                    'fontStyle': 'italic'
                                                }}
                                            >
                                                {mutableData.city && mutableData.province ? `${mutableData.city}, ${mutableData.province}` : 'not yet set'}
                                            </td>
                                            {isEditing && (
                                                <>
                                                    <td style={{
                                                        'color': '#808080'
                                                    }}>Province</td>
                                                    <Select
                                                        className="volunteer-select"
                                                        label="Province"
                                                        defaultValue={values.province ? 
                                                                {value: values.province, label: values.province} : 
                                                                {value: null, label: 'Select Province'}
                                                            }
                                                        styles={{
                                                            control: () => ({
                                                                padding: '8px 10px',
                                                                borderRadius: '4px',
                                                                border: '1px solid #cccccc',
                                                                cursor: 'pointer'
                                                            }),
                                                            valueContainer: (styles) => ({
                                                                ...styles,
                                                                padding: '0px'
                                                            }),
                                                            input: (styles) => ({
                                                                ...styles,
                                                                margin: '0px 2px',
                                                                padding: '0px',
                                                            }),
                                                        }}
                                                        options={provinces}
                                                        isSearchable={true}
                                                        components={
                                                            {
                                                                DropdownIndicator: () => 
                                                                    <CgSelect className="volunteer-select-dropdown-icon"/>,
                                                                IndicatorSeparator: () => null,
                                                                Option: (props) => {
                                                                    const {innerProps, innerRef} = props;
                                                                    return (
                                                                        <div {...innerProps} ref={innerRef} className="volunteer-select-item">
                                                                            {props.data.label}
                                                                        </div>
                                                                    )
                                                                },
                                                                Menu: (props) => {
                                                                    const {innerProps, innerRef} = props;
                                                                    return (
                                                                        <div {...innerProps} ref={innerRef}
                                                                        className="volunteer-select-menu">
                                                                            {props.children}
                                                                        </div>
                                                                    )
                                                                }
                                                            }
                                                        }
                                                        onChange={(e) => {
                                                            setSelectedProvince(e.value);
                                                            setFieldValue("province", e.value);
                                                        }}
                                                    />
                                                </>
                                            )}
                                        </tr>
                                        <tr hidden={!isEditing} className="profile-row">
                                            <td>City</td>
                                            <Select
                                                className="volunteer-select"
                                                label="City"
                                                defaultValue={values.city ? 
                                                        {value: values.city, label: values.city} : 
                                                        {value: null, label: 'Select City'}
                                                    }
                                                styles={{
                                                    control: () => ({
                                                        padding: '8px 10px',
                                                        borderRadius: '4px',
                                                        border: '1px solid #cccccc',
                                                        cursor: 'pointer'
                                                    }),
                                                    valueContainer: (styles) => ({
                                                        ...styles,
                                                        padding: '0px'
                                                    }),
                                                    input: (styles) => ({
                                                        ...styles,
                                                        margin: '0px 2px',
                                                        padding: '0px',
                                                    }),
                                                }}
                                                options={cities}
                                                isSearchable={true}
                                                components={
                                                    {
                                                        DropdownIndicator: () => 
                                                            <CgSelect className="volunteer-select-dropdown-icon"/>,
                                                        IndicatorSeparator: () => null,
                                                        Option: (props) => {
                                                            const {innerProps, innerRef} = props;
                                                            return (
                                                                <div {...innerProps} ref={innerRef} className="volunteer-select-item">
                                                                    {props.data.label}
                                                                </div>
                                                            )
                                                        },
                                                        Menu: (props) => {
                                                            const {innerProps, innerRef} = props;
                                                            return (
                                                                <div {...innerProps} ref={innerRef}
                                                                className="volunteer-select-menu">
                                                                    {props.children}
                                                                </div>
                                                            )
                                                        }
                                                    }
                                                }
                                                onChange={(e) => {
                                                    setFieldValue("city", e.value);
                                                }}
                                            />
                                        </tr>
                                    </tbody>
                                </table>
                                {isEditing && errors && Object.values(errors).map((error, index) => (
                                    <div key={index} className="profile-row-error">{error}</div>
                                ))}
                            </div>
                        </div>
                    </div>
                </form>)}
            </Formik>
        </div>
      );
}

export default VolunteerDetailsCard;