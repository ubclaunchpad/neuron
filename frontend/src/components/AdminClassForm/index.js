import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Formik, FieldArray, useFormikContext } from "formik";
import * as Yup from "yup";
import { CgSelect } from "react-icons/cg";
import upload_light from "../../assets/upload-light.png";
import upload_dark from "../../assets/upload-dark.png";
import delete_icon from "../../assets/delete-icon.png";
import add_icon from "../../assets/add-icon.png";
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

const Mode = {
    CREATE: "create",
    EDIT: "edit"
}

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
    class_name: Yup.string()
        .max(64, 'Class title cannot exceed 64 characters.')
        .required(inputPrompt),
    instructions: Yup.string()
        .max(3000, 'Description cannot exceed 3000 characters.')
        .optional(),
    zoom_link: Yup.string()
        .max(3000, 'Zoom link cannot exceed 3000 characters.')
        .url('Invalid URL format.')
        .optional(),
    start_date: Yup.date().required(inputPrompt),
    end_date: Yup.date()
        .required(inputPrompt)
        .min(Yup.ref('start_date'), 'End date must be after start date.'),
    category: Yup.string().required(inputPrompt),
    subcategory: Yup.string()
        .max(64, 'Class type cannot exceed 64 characters.')
        .optional(),
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
                fk_instructor_id: Yup.string().uuid(),
                volunteer_ids: Yup.array()
                    .of(Yup.string().uuid())
            })
        )
        .optional(),
    image: Yup.string().optional(),
});

function AutoResetForm({ initialValues }) {
    const { resetForm } = useFormikContext();

    useEffect(() => {
        resetForm({ values: initialValues });
    }, [initialValues, resetForm]);

    return null; // No UI needed, just handling reset
};

function AdminClassForm({ setUpdates }) {

    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState(Mode.CREATE);
    const [classData, setClassData] = useState({
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
    const [showVolunteers, setShowVolunteers] = useState([]);

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
            data.schedules = data.schedules.map((schedule) => {
                const {volunteers, ...rest} = schedule;
                return {
                    ...rest,
                    volunteer_ids: schedule.volunteers.map((volunteer) => volunteer.volunteer_id)
                }
            })
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
            setShowVolunteers(classData.schedules.map(() => false));

            // save class in 
            setClassData(classData);
            setLoading(false);
        }

        if (classId) {
            fetchData();
            setMode(Mode.EDIT);
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

    function buildVolunteers(assignedVolunteerIds) {
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

        // seperate added schedules from updated schedules
        const addedSchedules = values.schedules.filter((schedule) => !schedule.schedule_id)
        const updatedSchedules = values.schedules.filter((schedule) => schedule.schedule_id);
        const deletedSchedules = classData.schedules
                .filter((schedule) => !values.schedules.find((s) => s.schedule_id === schedule.schedule_id))
                .map((schedule) => schedule.schedule_id)

        // if user is sending an update right after a create, class id will be in classData
        const validClassId = classData.class_id ?? classId;

        const requests = [];
        requests.push(updateClass(validClassId, classDetails));
        if (updatedSchedules.length > 0)
            requests.push(updateSchedules(validClassId, updatedSchedules));

        if (addedSchedules.length > 0)
            requests.push(addSchedules(validClassId, addedSchedules));

        if (deletedSchedules.length > 0)
            requests.push(deleteSchedules(validClassId, deletedSchedules));

        if (image && image.blob) {
            const imageData = new FormData();
            imageData.append('image', image.blob);
            requests.push(uploadClassImage(validClassId, imageData));
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
        const onSuccess = (data) => {
            notyf.success("Class created successfully.");
            setSubmitting(false);
            setMode(Mode.EDIT);
            setClassData(data);
        }

        const onFailure = (error) => {
            console.log(error);
            notyf.error("Sorry, an error occurred while creating the class.");
            setSubmitting(false);
        }

        addClass(values)
            .then((res) => {
                // if image was included, send a subsequent request to upload the image
                if (image?.blob) {
                    const imageData = new FormData();
                    imageData.append('image', image.blob);
                    
                    uploadClassImage(res.data.class_id, imageData)
                        .then(() => onSuccess(res.data))
                        .catch(onFailure);
                } else {
                    onSuccess(res.data);
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
                enableReinitialize={true}
                initialValues={classData}
                validationSchema={ClassSchema}
                onSubmit={(values, { setSubmitting }) => {
                    if (mode === Mode.EDIT) {
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
                    <AutoResetForm initialValues={classData} />
                    <div className="form-block">
                        <h2 className="section-title">General</h2>
                        
                        <div className="row-error-wrapper">
                            <div className="input-row">
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
                            </div>
                            {errors["class_name"] && touched["class_name"] && (
                                <div className="invalid-message">{errors["class_name"]}</div>
                            )}
                        </div>
                        <div className="row-error-wrapper">
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
                            {errors["zoom_link"] && touched["zoom_link"] && (
                                <div className="invalid-message">{errors["zoom_link"]}</div>
                            )}
                        </div>
                        <div className="input-row">
                            <div className="element-error-wrapper">
                                <div className="flex-input">
                                    <label className="class-form-label">
                                        Category
                                    </label>
                                    <Select
                                        className="select"
                                        label="Category"
                                        defaultValue={{value: values.category, label: values.category ?? "Select Category"}}
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
                            <div className="element-error-wrapper">
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
                                {errors["subcategory"] && touched["subcategory"] && (
                                    <div className="invalid-message">{errors["subcategory"]}</div>
                                )}
                            </div>
                        </div>
                        <div className="row-error-wrapper">
                            <div className="input-row">
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
                                            label="Class Image"
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
                                <div className="flex-col-input description-input">
                                    <label className="class-form-label">
                                        Description
                                    </label>
                                    <textarea
                                        className="class-form-textarea"
                                        name="instructions"
                                        placeholder="Enter Description Here"
                                        rows="6"
                                        label="Description"
                                        value={values.instructions}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        errors={errors}
                                        touched={touched}
                                    />
                                    
                                </div>
                            </div>
                            {errors["instructions"] && touched["instructions"] && (
                                <div className="invalid-message">{errors["instructions"]}</div>
                            )}
                        </div>
                        <div className="input-row">
                            <div className="element-error-wrapper">
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
                            <div className="element-error-wrapper">
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
                                                        label="Day"
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
                                                label="Frequency"
                                                defaultValue={frequencies.find(f => f.value === schedule.frequency)}
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
                                            <div className="element-error-wrapper">
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
                                            <div className="element-error-wrapper">
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
                                        <div className="row-error-wrapper">
                                            <div className="input-row">
                                                <div className="flex-input">
                                                    <label className="class-form-label">
                                                        Instructor
                                                    </label>
                                                    <Select
                                                        className="select"
                                                        label="Instructor"
                                                        defaultValue={instructors.find(i => i.value === schedule.fk_instructor_id) || { label: 'Select Instructor', value: null }}
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
                                                            setFieldValue(`schedules[${index}].fk_instructor_id`, e.value);
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="input-row">
                                            <div className="flex-input volunteers-input">
                                                <label className="class-form-label">
                                                    Volunteers
                                                </label>
                                                <FieldArray
                                                    name={`schedules[${index}].volunteer_ids`}    
                                                >
                                                    {({ push, remove }) => (
                                                        <div className="volunteers-row">
                                                            {schedule.volunteer_ids.map((id, volunteerIndex) => {
                                                                const result = volunteers.find((volunteer) => volunteer.value.volunteer_id === id);
                                                                const volunteer = result?.value;
                                                                return volunteer && (
                                                                    <div key={volunteerIndex} className="volunteer-item">
                                                                        <span>
                                                                            {volunteer.p_name ?? volunteer.f_name + ' ' + volunteer.l_name}
                                                                        </span>
                                                                        <button 
                                                                            type="button"
                                                                            onClick={() => remove(volunteerIndex)} 
                                                                            className="delete-volunteer-button"
                                                                        >
                                                                            <img src={delete_icon} alt="Delete" className="delete-volunteer-icon"/>
                                                                        </button>
                                                                    </div>
                                                                )
                                                            })}
                                                            {showVolunteers[index] ? 
                                                                <Select
                                                                    className="select add-volunteers"
                                                                    defaultValue={{ value: null, label: 'Enter Volunteer Name' }}
                                                                    autoFocus={true}
                                                                    label="Volunteer"
                                                                    openMenuOnFocus={true}
                                                                    styles={{
                                                                        control: () => ({
                                                                            padding: '12px 16px',
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
                                                                    options={buildVolunteers(schedule.volunteer_ids)}
                                                                    isSearchable={true}
                                                                    components={
                                                                        {
                                                                            DropdownIndicator: () => null,
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
                                                                        push(e.value.volunteer_id)
                                                                        setShowVolunteers((prevItems) => {
                                                                            const newItems = [...prevItems];
                                                                            newItems[index] = false;
                                                                            return newItems;
                                                                        });
                                                                    }}
                                                                /> :
                                                                <button
                                                                    type="button"
                                                                    className="add-volunteer-button"
                                                                    onClick={() => {
                                                                        setShowVolunteers((prevItems) => {
                                                                            const newItems = [...prevItems];
                                                                            newItems[index] = true;
                                                                            return newItems;
                                                                        });
                                                                    }}
                                                                >
                                                                    <span>
                                                                        Add Volunteer
                                                                    </span>
                                                                    <div 
                                                                        className="add-volunteer-container"
                                                                    >
                                                                        <img src={add_icon} alt="Add" className="add-volunteer-icon"/>
                                                                    </div>
                                                                </button>
                                                            }
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
                                                            <button type="button" className="cancel-delete-button" onClick={() => setShowPopup(false)}>
                                                                Cancel
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="confirm-delete-button"
                                                                onClick={() => {
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
                                    <span>
                                        <h2 className="section-title add-schedule-text">
                                            Add Schedule
                                        </h2>
                                    </span>
                                    <div 
                                        className="add-schedule-container"
                                    >
                                        <img src={add_icon} alt="Add" className="add-schedule-icon"/>
                                    </div>
                                </button>
                            </div>
                        )}
                    </FieldArray>
                    <button 
                        type="submit" 
                        className="submit-button" 
                        disabled={isSubmitting} 
                    >
                        {mode === Mode.EDIT ? "Save Class" : "Create Class"}
                    </button>
                </form>
                )}
            </Formik>
        </div>
    )
}

export default AdminClassForm;