import { useEffect, useState } from "react";
import { Formik } from "formik";
import * as Yup from "yup";
import { CgSelect } from "react-icons/cg";
import Select from 'react-select';
import { getClassById, updateClass } from "../../api/classesPageService";
import notyf from "../../utils/notyf";
import "./index.css";

const ClassSchema = Yup.object().shape({
    class_name: Yup.string().required("Please fill out this field."),
    category: Yup.string(),
    subcategory: Yup.string(),
    instructions: Yup.string(),
});

// Custom styles
const categories = [
    { value: 'Online Exercise', label: 'Online Exercise' },
    { value: 'Creative & Expressive', label: 'Creative & Expressive' },
    { value: 'Care Partner Workshops', label: 'Care Partner Workshops' },
    { value: 'Food & Nutrition', label: 'Food & Nutrition' },
    { value: 'Other Oppurtunities', label: 'Other Oppurtunities' },
]

function AdminClassForm({ classId, setUpdates }) {

    const [loading, setLoading] = useState(true);
    const [classData, setClassData] = useState({
        class_name: '',
        category: '',
        subcategory: '',
        instructions: ''
    });

    useEffect(() => {
        if (classId) {
            getClassById(classId)
                .then((data) => {
                    console.log(data)
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
            <div className="general">
                <h2 className="section-title">General</h2>
                <Formik
                    initialValues={{
                        class_name: classData.class_name,
                        category: classData.category,
                        subcategory: classData.subcategory,
                        instructions: classData.instructions
                    }}
                    validationSchema={ClassSchema}
                    onSubmit={(values, { setSubmitting }) => {
                        // remove confirmPassword from the payload
                        updateClass(classId, values)
                            .then(() => {
                                notyf.success("Class updated successfully.");
                                setSubmitting(false);
                                setUpdates((prev) => prev + 1);
                            })
                            .catch((error) => {
                                notyf.error(error.response.data.error);
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
                            <div className="title-input">
                                <input 
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

                            <div className="input-row">
                                <div className="category-input">
                                    <label className="category-label">
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
                                                            {props.data.value}
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
                                <div className="category-input">
                                    <label className="category-label">
                                        Class Type
                                    </label>
                                    <input 
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
                            <div className="description-input">
                                <label className="description-label">
                                    Description
                                </label>
                                <textarea
                                    name="instructions"
                                    placeholder="Enter Description Here"
                                    rows="6"
                                    value={values.instructions}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    errors={errors}
                                    touched={touched}
                                    style={{
                                        maxWidth: '-webkit-fill-available',
                                        maxHeight: '300px'
                                    }}
                                />
                            </div>
                            <button type="submit" className="submit-button" disabled={isSubmitting}>
                                Publish Class
                            </button>
                        </form>
                    )}
                </Formik>
            </div>
        </div>
    )
}

export default AdminClassForm;