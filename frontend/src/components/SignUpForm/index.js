import { Formik } from "formik";
import { Link } from "react-router-dom";
import * as Yup from "yup";
import { signUp } from "../../api/authService";
import notyf from "../../utils/notyf";
import CustomButton from "../CustomButton";
import TextInput from "../TextInput";
import "./index.css";

const SignUpSchema = Yup.object().shape({
    firstName: Yup.string().required("Please fill out this field."),
    lastName: Yup.string().required("Please fill out this field."),
    email: Yup.string()
        .email("Please enter a valid email address.")
        .required("Please fill out this field."),
    password: Yup.string()
        .min(8, "Password must be at least 8 characters long.")
        .required("Please fill out this field."),
    confirmPassword: Yup.string()
        .required("Please fill out this field.")
        .oneOf([Yup.ref("password"), null], "Passwords don't match."),
});

const SignUpForm = () => {
    return (
        <>
            <Formik
                initialValues={{
                    firstName: "",
                    lastName: "",
                    email: "",
                    password: "",
                    confirmPassword: "",
                }}
                validationSchema={SignUpSchema}
                onSubmit={(values, { setSubmitting }) => {
                    // remove confirmPassword from the payload
                    delete values.confirmPassword;
                    values.role = "volunteer";
                    signUp(values)
                        .then(() => {
                            notyf.success("Account created successfully.");
                            setSubmitting(false);
                            setTimeout(() => {
                                navigate("/auth/login");
                            }, 2500);
                        })
                        .catch((error) => {
                            notyf.error(error.response.data.error);
                            setSubmitting(false);
                        });
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
                    <form onSubmit={handleSubmit} className="signUpForm">
                        <div className="twoInputs">
                            <TextInput
                                type="text"
                                placeholder="Enter your first name"
                                label="First Name"
                                name="firstName"
                                value={values.firstName}
                                handleChange={handleChange}
                                handleBlur={handleBlur}
                                errors={errors}
                                touched={touched}
                            />
                            <TextInput
                                type="text"
                                placeholder="Enter your last name"
                                label="Last Name"
                                name="lastName"
                                value={values.lastName}
                                handleChange={handleChange}
                                handleBlur={handleBlur}
                                errors={errors}
                                touched={touched}
                            />
                        </div>
                        <TextInput
                            type="email"
                            placeholder="Enter your email"
                            label="Email"
                            name="email"
                            value={values.email}
                            handleChange={handleChange}
                            handleBlur={handleBlur}
                            errors={errors}
                            touched={touched}
                        />
                        <TextInput
                            type="password"
                            placeholder="Create a password"
                            label="Create Password"
                            name="password"
                            value={values.password}
                            handleChange={handleChange}
                            handleBlur={handleBlur}
                            errors={errors}
                            touched={touched}
                        />
                        <TextInput
                            type="password"
                            placeholder="Confirm your password"
                            label="Confirm Password"
                            name="confirmPassword"
                            value={values.confirmPassword}
                            handleChange={handleChange}
                            handleBlur={handleBlur}
                            errors={errors}
                            touched={touched}
                        />
                        <CustomButton
                            text={"Create an Account"}
                            isSubmitting={isSubmitting}
                        />
                    </form>
                )}
            </Formik>
            <p className="helper">
                Already have an account?{" "}
                <strong>
                    <Link to={"/auth/login"}>Log In</Link>
                </strong>
            </p>
        </>
    );
};

export default SignUpForm;
