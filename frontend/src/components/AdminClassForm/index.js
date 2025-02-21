import { useEffect, useState } from "react";
import { Formik, FieldArray } from "formik";
import * as Yup from "yup";
import { CgSelect } from "react-icons/cg";
import camera_icon from "../../assets/upload.png";
import Select from 'react-select';
import { getClassById, updateClass, updateSchedules, uploadClassImage } from "../../api/classesPageService";
import notyf from "../../utils/notyf";
import "./index.css";
import { formatImageUrl } from "../../api/imageService";

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
    class_name: Yup.string().required(inputPrompt),
    instructions: Yup.string().optional(),
    zoom_link: Yup.string().url('Invalid URL format').required(inputPrompt),
    start_date: Yup.date().required(inputPrompt),
    end_date: Yup.date()
        .required(inputPrompt)
        .min(Yup.ref('start_date'), 'end_date must be after start_date'),
    category: Yup.string().optional(),
    subcategory: Yup.string().optional(),
    schedules: Yup.array()
        .of(
            Yup.object().shape({
                day: Yup.number().min(0).max(6).optional(), // 0 = Sunday, 6 = Saturday
                start_time: Yup.string()
                    .matches(/^([0-1]\d|2[0-3]):([0-5]\d)$/, 'Invalid start_time format (HH:mm)')
                    .optional(),
                end_time: Yup.string()
                    .matches(/^([0-1]\d|2[0-3]):([0-5]\d)$/, 'Invalid end_time format (HH:mm)')
                    .optional(),
                frequency: Yup.string()
                    .oneOf(frequencies.map(f => f.value))
                    .optional(),
                // volunteer_ids: Yup.array()
                //     .of(
                //         Yup.string().uuid('Invalid UUID format for volunteer_ids')
                //     )
                //     .optional(),
            })
        )
        .optional(),
    image: Yup.string().optional(),
});

function AdminClassForm({ classId, setUpdates }) {

    const [loading, setLoading] = useState(true);
    const [_, forceUpdate] = useState(0);
    const [classData, setClassData] = useState({
        class_name: '',
        category: '',
        subcategory: '',
        instructions: '',
        start_date: '',
        end_date: '',
        schedules: [],
    });
    const [image, setImage] = useState(null);

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

        if (classId) {
            getClassById(classId)
                .then((data) => {
                    // format date and times to be valid html inputs
                    formatDates(data)
                    formatTimes(data)

                    // get class image url
                    const imageUrl = formatImageUrl(data.fk_image_id);
                    setImage({ src: imageUrl });
                    
                    setClassData(data);
                })
                .catch((error) => {
                    console.error(error);
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, [classId]);

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
                    // remove confirmPassword from the payload
                    const classData = Object.fromEntries(
                        Object.entries(values).filter(([key]) => classFields.includes(key))
                    );
                    console.log("CLASS DATA:", classData)

                    const requests = [];
                    requests.push(updateClass(classId, classData));
                    requests.push(updateSchedules(classId, values.schedules));

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
                        .catch(() => {
                            notyf.error("Sorry, an error occurred while updating the class.");
                            setSubmitting(false);
                        });
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
                        <div className="input-row">
                            <div className="flex-input">
                                <label className="class-form-label">
                                    Category
                                </label>
                                <Select
                                    className="select"
                                    placeholder="Select"
                                    defaultValue={{value: values.category, label: values.category}}
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
                                    <div className={image ? "overlay" : "upload-content"}>
                                        <img src={camera_icon} alt="Edit Profile" className="upload-icon" />
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
                        </div>
                    </div>
                    <FieldArray
                        name="schedules"    
                    >
                        {({ push, remove }) => (
                            values.schedules.map((schedule, index) => (
                                <div className="form-block">
                                    <h2 className="section-title">Schedule {index + 1}</h2>
                                    <div className="days-input">
                                        <div className="days-row">
                                            {days.map((day, dayIndex) => (
                                                <button 
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
                                                        forceUpdate((prev) => !prev);
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
                                            className="frequency"
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
                                    </div>
                                </div>
                            ))
                        )}
                    </FieldArray>
                    <button type="submit" className="submit-button">
                        Publish Class
                    </button>
                </form>
                )}
            </Formik>
        </div>
    )
}

export default AdminClassForm;