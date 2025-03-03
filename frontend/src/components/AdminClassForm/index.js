import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Formik, FieldArray } from "formik";
import * as Yup from "yup";
import { CgSelect } from "react-icons/cg";
import upload_light from "../../assets/upload-light.png";
import upload_dark from "../../assets/upload-dark.png";
import Select from 'react-select';
import { 
    getClassById, 
    addClass,
    updateClass, 
    updateSchedules,
    addSchedules, 
    deleteSchedules,
    uploadClassImage 
} from "../../api/classesPageService";
import notyf from "../../utils/notyf";
import "./index.css";
import { formatImageUrl } from "../../api/imageService";
import { getAllInstructors } from "../../api/instructorService";
import { getAllVolunteers } from "../../api/volunteerService";

const categories = [
    { value: 'Online Exercise', label: 'Online Exercise' },
    { value: 'Creative & Expressive', label: 'Creative & Expressive' },
    { value: 'Care Partner Workshops', label: 'Care Partner Workshops' },
    { value: 'Food & Nutrition', label: 'Food & Nutrition' },
    { value: 'Other Opportunities', label: 'Other Opportunities' },
]

const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
]

const frequencies = [
    { value: 'once', label: 'Once' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'biweekly', label: 'Bi-Weekly' },
]

const classFields = [
    "fk_instructor_id",
    "class_name",
    "instructions",
    "zoom_link",
    "start_date",
    "end_date",
    "category",
    "subcategory"
]

const inputPrompt = "Please fill out this field.";

const ClassSchema = Yup.object().shape({
    fk_instructor_id: Yup.string().required(inputPrompt),
    class_name: Yup.string().required(inputPrompt),
    instructions: Yup.string().optional(),
    zoom_link: Yup.string().url('Invalid URL format').required(inputPrompt),
    start_date: Yup.date().required(inputPrompt),
    end_date: Yup.date()
        .required(inputPrompt)
        .min(Yup.ref('start_date'), 'End date must be after start date.'),
    category: Yup.string().required(inputPrompt),
    subcategory: Yup.string().optional(),
    schedules: Yup.array()
        .of(
            Yup.object().shape({
                schedule_id: Yup.number().optional(), // newly added schedules will not yet have an id
                day: Yup.number().min(0).max(6), // 0 = Sunday, 6 = Saturday
                start_time: Yup.string()
                    .matches(/^([0-1]\d|2[0-3]):([0-5]\d)$/, 'Invalid start time format (HH:mm)')
                    .required(inputPrompt),
                end_time: Yup.string()
                    .matches(/^([0-1]\d|2[0-3]):([0-5]\d)$/, 'Invalid end time format (HH:mm)')
                    .required(inputPrompt)
                    .test("is-after-start", "End time must be after start time.", function (end_time) {
                        const { start_time } = this.parent;
                        if (!start_time || !end_time) return false;

                        const toMinutes = (time) => {
                          const [h, m] = time.split(":").map(Number);
                          return h * 60 + m;
                        };
                  
                        return toMinutes(end_time) > toMinutes(start_time);
                    }),
                frequency: Yup.string()
                    .oneOf(frequencies.map(f => f.value)),
                volunteer_ids: Yup.array()
                    .of(Yup.string().uuid())
            })
        )
        .optional(),
    image: Yup.string().optional(),
});

function AdminClassForm({ setUpdates }) {

    const [loading, setLoading] = useState(true);
    const [classData, setClassData] = useState({
        fk_instructor_id: '',
        class_name: '',
        category: null,
        subcategory: '',
        instructions: '',
        start_date: '',
        end_date: '',
        schedules: [],
    });
    const [image, setImage] = useState(null);
    const [instructors, setInstructors] = useState([]);
    const [volunteers, setVolunteers] = useState([]);
    const [showPopup, setShowPopup] = useState(false);
    const selectRefs = useRef([]);

    const location = useLocation();
    const classId = location.state?.classId;

    useEffect(() => {
        const formatDates = (data => {
            data.start_date = data.start_date.split('T')[0];
            data.end_date = data.end_date.split('T')[0];
        })

        const formatTime = (time => {
            const [hours, minutes] = time.split(':');
            return `${hours}:${minutes}`;
        })

        const formatTimes = (data) => {
            data.schedules.forEach((schedule) => {
                schedule.start_time = formatTime(schedule.start_time);
                schedule.end_time = formatTime(schedule.end_time);
            })
        }

        const formatVolunteers = (data) => {
            data.schedules = data.schedules.map((schedule) => ({
                schedule_id: schedule.schedule_id,
                start_time: schedule.start_time,
                end_time: schedule.end_time,
                frequency: schedule.frequency,
                day: schedule.day,
                volunteer_ids: schedule.volunteers.map((volunteer) => volunteer.volunteer_id)
            }))
        }

        const fetchData = async () => {
            const classData = await getClassById(classId);
            formatDates(classData);
            formatTimes(classData);
            formatVolunteers(classData);

            // get class image url
            if (classData.fk_image_id) {
                const imageUrl = formatImageUrl(classData.fk_image_id);
                setImage({ src: imageUrl });
            }
            
            console.log(classData);

            // save class in 
            setClassData(classData);
            setLoading(false);
        }

        if (classId) {
            fetchData();
        } else {
            setLoading(false);
        }
    }, [classId]);

    useEffect(() => {
        const fetchData = async () => {
            const instructorData = await getAllInstructors();
            const instructors = instructorData.map((instructor) => {
                return {
                    value: instructor.instructor_id,
                    label: instructor.f_name + ' ' + instructor.l_name
                }
            });
            console.log(instructorData);
            console.log(instructors);
            setInstructors(instructors);

            const volunteerData = await getAllVolunteers();
            const volunteers = volunteerData.map((volunteer) => {
                return {
                    value: {
                        volunteer_id: volunteer.volunteer_id,
                        p_name: volunteer.p_name,
                        f_name: volunteer.f_name,
                        l_name: volunteer.l_name
                    },
                    label: volunteer.p_name ?? volunteer.f_name + ' ' + volunteer.l_name
                }
            });
            setVolunteers(volunteers);
        }
        fetchData();
    }, []);


    function buildVolunteers(assignedVolunteers) {
        const assignedVolunteerIds = assignedVolunteers.map((volunteer) => volunteer.volunteer_id);
        return volunteers.filter((volunteer) => !assignedVolunteerIds.includes(volunteer.value.volunteer_id));
    }

    function timeErrorExists(errors, touched, index) {
        return errors.schedules && 
            errors.schedules[index] && 
            errors.schedules[index]["end_time"] && 
            touched.schedules && 
            touched.schedules[index] && 
            (touched.schedules[index]["end_time"] || touched.schedules[index]["start_time"])
    }

    function update(values, setSubmitting) {
        const classDetails = Object.fromEntries(
            Object.entries(values).filter(([key]) => classFields.includes(key))
        );
        console.log("CLASS DATA:", classDetails)

        // seperate added schedules from updated schedules
        const addedSchedules = values.schedules.filter((schedule) => !schedule.schedule_id)
        const updatedSchedules = values.schedules.filter((schedule) => schedule.schedule_id);
        const deletedSchedules = classData.schedules
                .filter((schedule) => !values.schedules.find((s) => s.schedule_id === schedule.schedule_id))
                .map((schedule) => schedule.schedule_id)

        console.log("ADDED SCHEDULES:", addedSchedules);
        console.log("UPDATED SCHEDULES:", updatedSchedules);
        console.log("DELETED SCHEDULES:", deletedSchedules);

        const requests = [];
        requests.push(updateClass(classId, classDetails));
        if (updatedSchedules.length > 0)
            requests.push(updateSchedules(classId, updatedSchedules));

        if (addedSchedules.length > 0)
            requests.push(addSchedules(classId, addedSchedules));

        if (deletedSchedules.length > 0)
            requests.push(deleteSchedules(classId, deletedSchedules));

        if (image.blob) {
            const imageData = new FormData();
            imageData.append('image', image.blob);
            requests.push(uploadClassImage(classId, imageData));
        }

        Promise.all(requests)
            .then(() => {
                notyf.success("Class updated successfully.");
                setSubmitting(false);
                setUpdates((prev) => prev + 1);
            })
            .catch((error) => {
                console.log(error);
                notyf.error("Sorry, an error occurred while updating the class.");
                setSubmitting(false);
            });
    }

    function add(values, setSubmitting) {
        const onSuccess = () => {
            notyf.success("Class created successfully.");
            setSubmitting(false);
            setUpdates((prev) => prev + 1);
        }

        const onFailure = (error) => {
            console.log(error);
            notyf.error("Sorry, an error occurred while creating the class.");
            setSubmitting(false);
        }

        addClass(values)
            .then((res) => {
                // if image was included, send a subsequent request to upload the image
                if (image.blob) {
                    const imageData = new FormData();
                    imageData.append('image', image.blob);
                    
                    uploadClassImage(res.data.class_id, imageData)
                        .then(onSuccess)
                        .catch(onFailure);
                } else {
                    onSuccess();
                }
            })
            .catch(onFailure);
    }

    if (loading) {
        return <></>;
    }

    return (
        <div className="class-form">
            <Formik
                initialValues={classData}
                validationSchema={ClassSchema}
                onSubmit={(values, { setSubmitting }) => {
                    console.log("VALUES:", values)
                    if (classId) {
                        update(values, setSubmitting);
                    } else {
                        add(values, setSubmitting);
                    }
                }}
            >
                {({
                    values,
                    errors,
                    touched,
                    handleChange,
                    handleBlur,
                    handleSubmit,
                    setFieldValue,
                    isSubmitting
                }) => (
                <form onSubmit={handleSubmit} className="form-body">
                    <div className="form-block">
                        <h2 className="section-title">General</h2>
                        
                        <div className="title-input">
                            <input 
                                className="class-form-input"
                                type="text"
                                placeholder="Enter Title Here"
                                label="Title"
                                name="class_name"
                                value={values.class_name}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                errors={errors}
                                touched={touched}
                            />
                            {errors["class_name"] && touched["class_name"] && (
                                <div className="invalid-message">{errors["class_name"]}</div>
                            )}
                        </div>
                        <div className="flex-input">
                            <label className="class-form-label">
                                Zoom Link
                            </label>
                            <input 
                                className="class-form-input"
                                type="url"
                                placeholder="Enter Zoom Link"
                                label="Zoom Link"
                                name="zoom_link"
                                value={values.zoom_link}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                errors={errors}
                                touched={touched}
                            />
                        </div>
                        <div className="input-row categories-row">
                            <div className="error-wrapper">
                                <div className="flex-input">
                                    <label className="class-form-label">
                                        Category
                                    </label>
                                    <Select
                                        className="select"
                                        defaultValue={{value: values.category, label: values.category ?? "Select Category"}}
                                        styles={{
                                            control: () => ({
                                                width: 'stretch',
                                                padding: '12px 32px 12px 16px',
                                                borderRadius: '8px',
                                                border: '1px solid #cccccc',
                                                cursor: 'pointer'
                                            }),
                                            valueContainer: (styles) => ({
                                                ...styles,
                                                padding: '0px'
                                            })
                                        }}
                                        options={categories}
                                        isSearchable={false}
                                        components={
                                            {
                                                DropdownIndicator: () => 
                                                    <CgSelect className="select-icon"/>,
                                                IndicatorSeparator: () => null,
                                                Option: (props) => {
                                                    const {innerProps, innerRef} = props;
                                                    return (
                                                        <div {...innerProps} ref={innerRef} className="select-item">
                                                            {props.data.label}
                                                        </div>
                                                    )
                                                },
                                                Menu: (props) => {
                                                    const {innerProps, innerRef} = props;
                                                    return (
                                                        <div {...innerProps} ref={innerRef}
                                                        className="select-menu">
                                                            {props.children}
                                                        </div>
                                                    )
                                                }
                                            }
                                        }
                                        onChange={(e) => {
                                            setFieldValue("category", e.value);
                                        }}
                                    />
                                </div>
                                {errors["category"] && touched["category"] && (
                                    <div className="invalid-message">{errors["category"]}</div>
                                )}
                            </div>
                            <div className="flex-input">
                                <label className="class-form-label">
                                    Class Type
                                </label>
                                <input 
                                    className="class-form-input"
                                    type="text"
                                    placeholder="Enter Class Type"
                                    label="Type"
                                    name="subcategory"
                                    value={values.subcategory}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    errors={errors}
                                    touched={touched}
                                />
                            </div>
                        </div>
                        
                        <div className="input-row">
                            <div className="flex-col-input description-input">
                                <label className="class-form-label">
                                    Description
                                </label>
                                <textarea
                                    className="class-form-textarea"
                                    name="instructions"
                                    placeholder="Enter Description Here"
                                    rows="6"
                                    value={values.instructions}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    errors={errors}
                                    touched={touched}
                                />
                            </div>
                            <div className="flex-col-input image-input">
                                <label className="class-form-label">
                                    Class Image
                                </label>
                                <div 
                                    className="image-content"
                                    onClick={() => {
                                        document.getElementById('fileInput').click()
                                    }}
                                >
                                    {image && <img
                                        className="class-image"
                                        src={image.src}
                                        alt="Class"
                                        onError={(e) => {
                                            console.log(e);
                                        }}
                                    />}
                                    <div className={image ? "class-image-overlay" : "class-upload-content"}>
                                        <img src={image ? upload_light : upload_dark} alt="Edit Profile" className="upload-icon" />
                                        <button type="button" className="edit-button">Browse Images</button>
                                    </div>
                                    <input
                                        className="file-input"
                                        id="fileInput" 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={(event) => {
                                            const targetImage = event.target.files[0];
                                            const reader = new FileReader();
                                            reader.onload = () => {
                                                setImage({
                                                    src: reader.result,
                                                    blob: targetImage
                                                });
                                            };
                                            reader.readAsDataURL(targetImage);
                                        }} 
                                    />
                                    
                                </div>
                            </div>
                        </div>
                        <div className="input-row">
                            <div className="error-wrapper">
                                <div className="flex-input">
                                    <label className="class-form-label">
                                        Start Date
                                    </label>
                                    <input 
                                        className="class-form-input"
                                        type="date"
                                        label="Start Date"
                                        name="start_date"
                                        value={values.start_date}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        errors={errors}
                                        touched={touched}
                                    />
                                </div>
                                {errors["start_date"] && touched["start_date"] && (
                                    <div className="invalid-message">{errors["start_date"]}</div>
                                )}
                            </div>
                            <div className="error-wrapper">
                                <div className="flex-input">
                                    <label className="class-form-label">
                                        End Date
                                    </label>
                                    <input 
                                        className="class-form-input"
                                        type="date"
                                        label="End Date"
                                        name="end_date"
                                        value={values.end_date}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        errors={errors}
                                        touched={touched}
                                    />
                                </div>
                                {errors["end_date"] && touched["end_date"] && (
                                    <div className="invalid-message">{errors["end_date"]}</div>
                                )}
                            </div>
                        </div>
                        <div className="input-row">
                            <div className="error-wrapper">
                                <div className="flex-input">
                                    <label className="class-form-label">
                                        Instructor
                                    </label>
                                    <Select
                                        className="select"
                                        defaultValue={instructors.find(i => i.value === values.fk_instructor_id) || { label: 'Select', value: null }}
                                        styles={{
                                            control: () => ({
                                                width: 'stretch',
                                                padding: '12px 32px 12px 16px',
                                                borderRadius: '8px',
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
                                        options={instructors}
                                        isSearchable={true}
                                        components={
                                            {
                                                DropdownIndicator: () => 
                                                    <CgSelect className="select-icon"/>,
                                                IndicatorSeparator: () => null,
                                                Option: (props) => {
                                                    const {innerProps, innerRef} = props;
                                                    return (
                                                        <div {...innerProps} ref={innerRef} className="select-item">
                                                            {props.data.label}
                                                        </div>
                                                    )
                                                },
                                                Menu: (props) => {
                                                    const {innerProps, innerRef} = props;
                                                    return (
                                                        <div {...innerProps} ref={innerRef}
                                                        className="select-menu">
                                                            {props.children}
                                                        </div>
                                                    )
                                                }
                                            }
                                        }
                                        onChange={(e) => {
                                            setFieldValue(`fk_instructor_id`, e.value);
                                        }}
                                    />
                                </div>
                                {errors["fk_instructor_id"] && touched["fk_instructor_id"] && (
                                    <div className="invalid-message">{errors["fk_instructor_id"]}</div>
                                )}
                            </div>
                        </div>
                    </div>
                    <FieldArray
                        name="schedules"    
                    >
                        {({ push, remove }) => (
                            <div className="schedule-blocks">{
                                values.schedules.map((schedule, index) => (
                                    <div className="form-block" key={index}>
                                        <h2 className="section-title">Class Schedule {index + 1}</h2>
                                        <div className="days-input">
                                            <label className="class-form-label">
                                                Select the day the class will run
                                            </label>
                                            <div className="days-row">
                                                {days.map((day, dayIndex) => (
                                                    <button 
                                                        key={dayIndex}
                                                        type="button"
                                                        style={dayIndex === schedule.day ? {
                                                            background: '#F0FAFF',
                                                            border: '1px solid #4385AC',
                                                            color: '#0F1111',
                                                            fontWeight: '500'
                                                        } : {}}
                                                        value={dayIndex}
                                                        className={`${day.toLowerCase()}-input day-input`}
                                                        onClick={(e) => {
                                                            setFieldValue(`schedules[${index}].day`, Number(e.target.value));
                                                            setUpdates((prev) => prev + 1);
                                                        }}
                                                    >
                                                        {day}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="input-row">
                                            <div className="flex-input">
                                            <label className="class-form-label">
                                                Frequency
                                            </label>
                                            <Select
                                                className="select"
                                                placeholder="Select"
                                                defaultValue={frequencies.find(f => f.value === schedule.frequency)}
                                                styles={{
                                                    control: () => ({
                                                        width: 'stretch',
                                                        padding: '12px 32px 12px 16px',
                                                        borderRadius: '8px',
                                                        border: '1px solid #cccccc',
                                                        cursor: 'pointer'
                                                    }),
                                                    valueContainer: (styles) => ({
                                                        ...styles,
                                                        padding: '0px'
                                                    })
                                                }}
                                                options={frequencies}
                                                isSearchable={false}
                                                components={
                                                    {
                                                        DropdownIndicator: () => 
                                                            <CgSelect className="select-icon"/>,
                                                        IndicatorSeparator: () => null,
                                                        Option: (props) => {
                                                            const {innerProps, innerRef} = props;
                                                            return (
                                                                <div {...innerProps} ref={innerRef} className="select-item">
                                                                    {props.data.label}
                                                                </div>
                                                            )
                                                        },
                                                        Menu: (props) => {
                                                            const {innerProps, innerRef} = props;
                                                            return (
                                                                <div {...innerProps} ref={innerRef}
                                                                className="select-menu">
                                                                    {props.children}
                                                                </div>
                                                            )
                                                        }
                                                    }
                                                }
                                                onChange={(e) => {
                                                    setFieldValue(`schedules[${index}].frequency`, e.value);
                                                }}
                                            />
                                            </div>
                                        </div>
                                        <div className="input-row">
                                            <div className="error-wrapper">
                                                <div className="flex-input">
                                                    <label className="class-form-label">
                                                        From
                                                    </label>
                                                    <input 
                                                        className="class-form-input"
                                                        type="time"
                                                        label="From"
                                                        name={`schedules[${index}].start_time`}
                                                        value={schedule.start_time}
                                                        onChange={handleChange}
                                                        onBlur={handleBlur}
                                                        errors={errors}
                                                        touched={touched}
                                                    />
                                                </div>
                                            </div>
                                            <div className="error-wrapper">
                                                <div className="flex-input">
                                                    <label className="class-form-label">
                                                        To
                                                    </label>
                                                    <input 
                                                        className="class-form-input"
                                                        type="time"
                                                        label="To"
                                                        name={`schedules[${index}].end_time`}
                                                        value={schedule.end_time}
                                                        onChange={handleChange}
                                                        onBlur={handleBlur}
                                                        errors={errors}
                                                        touched={touched}
                                                    />
                                                </div>
                                                {timeErrorExists(errors, touched, index) && (
                                                    <div className="invalid-message">{errors.schedules[index]["end_time"]}</div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="input-row">
                                            <div className="flex-input">
                                                <label className="class-form-label">
                                                    Volunteers
                                                </label>
                                                <FieldArray
                                                    name={`schedules[${index}].volunteers`}    
                                                >
                                                    {({ push, remove }) => (
                                                        <div className="volunteers-row">
                                                            {schedule.volunteer_ids.map((id, volunteerIndex) => {
                                                                const result = volunteers.find((volunteer) => volunteer.value.volunteer_id === id);
                                                                const volunteer = result.value;
                                                                return volunteer && (
                                                                    <div key={volunteerIndex} className="volunteer-item">
                                                                        {volunteer.p_name ?? volunteer.f_name + ' ' + volunteer.l_name}
                                                                    </div>
                                                                )
                                                            })}
                                                            {/* <Select
                                                                className="select add-volunteers"
                                                                ref={el => (selectRefs.current[index] = el)}
                                                                defaultValue={{ value: null, label: 'Add Volunteers' }}
                                                                styles={{
                                                                    control: () => ({
                                                                        padding: '12px 32px 12px 16px',
                                                                        borderRadius: '8px',
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
                                                                options={buildVolunteers(schedule.volunteers)}
                                                                isSearchable={true}
                                                                components={
                                                                    {
                                                                        DropdownIndicator: () => 
                                                                            <CgSelect className="select-icon"/>,
                                                                        IndicatorSeparator: () => null,
                                                                        Option: (props) => {
                                                                            const {innerProps, innerRef} = props;
                                                                            return (
                                                                                <div {...innerProps} ref={innerRef} className="select-item">
                                                                                    {props.data.label}
                                                                                </div>
                                                                            )
                                                                        },
                                                                        Menu: (props) => {
                                                                            const {innerProps, innerRef} = props;
                                                                            return (
                                                                                <div {...innerProps} ref={innerRef}
                                                                                className="select-menu">
                                                                                    {props.children}
                                                                                </div>
                                                                            )
                                                                        }
                                                                    }
                                                                }
                                                                onChange={(e) => {
                                                                    console.log("e:", e)
                                                                    if (e?.value) {
                                                                        console.log("VALUE:", e.value);
                                                                        push({
                                                                            volunteer_id: e.value.volunteer_id,
                                                                            p_name: e.value.p_name,
                                                                            f_name: e.value.f_name,
                                                                            l_name: e.value.l_name,
                                                                        });

                                                                        console.log("REF:", selectRefs.current[index])
                                                                        
                                                                        // set select to default (placeholder) value
                                                                        selectRefs.current[index].clearValue();

                                                                        console.log("REF VALUE:", selectRefs.current[index].getValue())
                                                                    }
                                                                    forceUpdate((prev) => !prev)
                                                                }}
                                                            /> */}
                                                        </div>
                                                    )}
                                                </FieldArray>
                                            </div>
                                        </div>
                                        <div className="delete-schedule-row">
                                            <button 
                                                type="button" 
                                                className="delete-schedule-button" 
                                                onClick={() => setShowPopup(true)}
                                            >
                                                Delete Schedule
                                            </button>
                                            {showPopup && (
                                                <div className="delete-popup-overlay">
                                                    <div className="delete-popup">
                                                        <h2 className="delete-popup-title">Delete Schedule</h2>
                                                        <p className="delete-popup-prompt">Delete this schedule from the class?</p>
                                                        <div className="delete-popup-buttons">
                                                            <button type="button" className="cancel-button" onClick={() => setShowPopup(false)}>
                                                                Cancel
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="confirm-delete-button"
                                                                onClick={() => {
                                                                    console.log("Deleted!"); // Replace with delete logic
                                                                    remove(index);
                                                                    setShowPopup(false);
                                                                }}
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <button 
                                    type="button"
                                    className="form-block add-schedule-button"
                                    onClick={() => {
                                        push({
                                            day: 3,
                                            start_time: '12:00',
                                            end_time: '12:00',
                                            frequency: frequencies[1].value, // weekly
                                            volunteer_ids: []
                                        });
                                        setUpdates((prev) => prev + 1);  
                                    }}
                                >
                                    <h2 className="section-title add-schedule-text">+ Add Class Schedule</h2>
                                </button>
                            </div>
                        )}
                    </FieldArray>
                    <button 
                        type="submit" 
                        className="submit-button" 
                        disabled={isSubmitting} 
                    >
                        Publish Class
                    </button>
                </form>
                )}
            </Formik>
        </div>
    )
}

export default AdminClassForm;