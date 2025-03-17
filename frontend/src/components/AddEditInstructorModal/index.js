import { Formik } from "formik";
import { useEffect, useState } from "react";
import * as Yup from "yup";
import { addInstructor, editInstructor } from "../../api/instructorService";
import { useAuth } from "../../contexts/authContext";
import cleanInitials from "../../utils/cleanInitials";
import notyf from "../../utils/notyf";
import DeactivateReactivateModal from "../Deactivate-Reactivate-Modal";
import Modal from "../Modal";
import TextInput from "../TextInput";
import "./index.css";

const AddEditInstructorModal = ({ closeEvent, instructor_data = null }) => {

    const { user } = useAuth();
    const [instructorData, setInstructorData] = useState({
        instructor_name: "",
        instructor_email: "",
        initials: "",
    });
    const [loading, setLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    useEffect(() => {
        if (instructor_data) {
            setInstructorData({
                instructor_name: instructor_data.f_name + " " + instructor_data.l_name,
                instructor_email: instructor_data.email,
                initials: "",
            });
        }
        setLoading(false);
    }, [instructor_data]);

    const AddInstructorSchema = Yup.object().shape({
        instructor_name: Yup.string()
            .required("Please enter instructor's name.")
            .matches(/^[a-zA-Z]+ [a-zA-Z]+$/, "Please enter instructor's full name."),
        instructor_email: Yup.string()
            .required("Please enter instructor's email.")
            .email("Please enter a valid email."),
        initials: Yup.string()
            .required("Please enter your admin initials.")
            .matches(/^[a-zA-Z][^a-zA-Z]*[a-zA-Z][^a-zA-Z]*$/, "Please enter only two letters."), 
    });

    return (
        <div>
            {!loading && 
                <Formik
                    initialValues={instructorData}
                    validationSchema={AddInstructorSchema}
                    onSubmit={(values, { setSubmitting }) => {
                        const initials = cleanInitials(values.initials);
                        // if (initials !== user.f_name[0].toUpperCase() + "" + user.l_name[0].toUpperCase()) {
                        //     notyf.error("Initials don't match your admin initials.");
                        //     setSubmitting(false);
                        //     return;
                        // }
                        const instructor_name = values.instructor_name.split(" ");
                        const data = {
                            f_name: instructor_name[0],
                            l_name: instructor_name[1],
                            email: values.instructor_email
                        }

                        if (instructor_data !== null) {
                            editInstructor(instructor_data.instructor_id, data)
                                .then(() => {
                                    notyf.success("Instructor details updated successfully.");
                                    closeEvent();
                                })
                                .catch((error) => {
                                    notyf.error("Failed to update instructor details.");
                                });
                        } else {
                            addInstructor(data)
                                .then(() => {
                                    notyf.success("Instructor added successfully.");
                                    closeEvent();
                                })
                                .catch((error) => {
                                    notyf.error("Failed to add instructor.");
                                });
                        }
                        setSubmitting(false);
                    }}>
                    {({
                        values,
                        errors,
                        touched,
                        handleChange,
                        handleBlur,
                        handleSubmit,
                        isSubmitting,
                    }) => (
                        <form onSubmit={handleSubmit} className="add-instructor-form">
                            <div className="add-instructor-inputs">
                                <TextInput
                                    label="Instructor Name"
                                    hint="(Required)"
                                    name="instructor_name"
                                    type="text"
                                    placeholder="Enter instructor's full name"
                                    value={values.instructor_name}
                                    handleChange={handleChange}
                                    handleBlur={handleBlur}
                                    errors={errors}
                                    touched={touched}
                                    />
                                <TextInput
                                    label="Instructor Email"
                                    hint="(Required)"
                                    name="instructor_email"
                                    type="email"
                                    placeholder="Enter instructor's email"
                                    value={values.instructor_email}
                                    handleChange={handleChange}
                                    handleBlur={handleBlur}
                                    errors={errors}
                                    touched={touched}
                                    />
                                <TextInput
                                    label="Your admin initials (for logging purposes)"
                                    hint="(Required)"
                                    name="initials"
                                    type="text"
                                    placeholder="M.U"
                                    value={values.initials}
                                    handleChange={handleChange}
                                    handleBlur={handleBlur}
                                    errors={errors}
                                    touched={touched}
                                    />
                            </div>
                            {instructor_data === null && <button className="admin-add-instructor-button" type="submit" disabled={isSubmitting}>Add Instructor</button>}
                            {instructor_data !== null && <div className="edit-buttons">
                                <button onClick={() => setShowDeleteModal(true)} type="button" className="admin-add-instructor-button delete-button">Delete</button>
                                <button className="admin-add-instructor-button" type="submit" disabled={isSubmitting}>Save</button>
                                </div>}
                        </form>
                    )}
                </Formik>
                }
                
                {instructor_data !== null &&
                    <Modal title="Delete instructor profile" isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} width="500px" height="fit-content">
                        <DeactivateReactivateModal id={instructor_data.instructor_id} closeEvent={() => {
                            setShowDeleteModal(false);
                            closeEvent();
                        }} type={2} />
                    </Modal>
                }
        </div>
    )
}

export default AddEditInstructorModal