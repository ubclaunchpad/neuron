import TextInput from "../TextInput"
import { Formik } from "formik";
import * as Yup from "yup";
import "./index.css";
import { useAuth } from "../../contexts/authContext";
import notyf from "../../utils/notyf";
import { addInstructor } from "../../api/adminService";
import cleanInitials from "../../utils/cleanInitials";

const AddInstructorModal = ({ closeEvent }) => {

    const { user } = useAuth();

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
            <Formik
                initialValues={{
                    instructor_name: "",
                    instructor_email: "",
                    initials: "",
                }}
                validationSchema={AddInstructorSchema}
                onSubmit={(values, { setSubmitting }) => {
                    const initials = cleanInitials(values.initials);
                    if (initials !== user.f_name[0].toUpperCase() + "" + user.l_name[0].toUpperCase()) {
                        notyf.error("Initials don't match your admin initials.");
                        setSubmitting(false);
                        return;
                    }
                    const instructor_name = values.instructor_name.split(" ");
                    const data = {
                        f_name: instructor_name[0],
                        l_name: instructor_name[1],
                        email: values.instructor_email
                    }
                    addInstructor(data)
                        .then(() => {
                            notyf.success("Instructor added successfully.");
                            setSubmitting(false);
                            closeEvent();
                        })
                        .catch((error) => {
                            notyf.error("Failed to add instructor.");
                            setSubmitting(false);
                        });
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
                        <button className="admin-add-instructor-button" type="submit" disabled={isSubmitting}>Add Instructor</button>
                    </form>
                )}
            </Formik>
        </div>
    )
}

export default AddInstructorModal