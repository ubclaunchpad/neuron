import TextInput from "../TextInput";
import CustomButton from "../CustomButton";
import { Link, useNavigate } from "react-router-dom"
import { login } from "../../api/authService";
import notyf from "../../utils/notyf";
import { Formik } from "formik";
import * as Yup from "yup";
import "./index.css";

const LoginSchema = Yup.object().shape({
    email: Yup.string()
        .email("Please enter a valid email address.")
        .required("Please fill out this field."),
    password: Yup.string().required("Please fill out this field."),
});

const LoginForm = () => {
    const navigate = useNavigate();

    return (
        <>
            <Formik
                initialValues={{
                    email: "",
                    password: "",
                }}
                validationSchema={LoginSchema}
                onSubmit={(values, { setSubmitting }) => {
                    login(values)
                        .then((response) => {
                            notyf.success("Logged in successfully");
                            // Save the token in the local storage
                            localStorage.setItem("neuronAuthToken", response.token);
                            setTimeout(() => {
                                // Redirect to the home page so that the user cannot go back to the login page
                                navigate("/");
                            }, 1500);
                            setSubmitting(false);
                        })
                        .catch((error) => {
                            if (error && error.response && error.response.data && error.response.data.error) {
                                const backendError = error.response?.data?.error;
                                if (backendError == "verifyError") {
                                    // Redirect to account not verified
                                    navigate("/auth/account-not-verified");
                                    setSubmitting(false);
                                }
                            }
                             else {
                                notyf.error(error.response.data.error);
                                setSubmitting(false);
                            }
                            
                            
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
                    <form className="loginForm" onSubmit={handleSubmit}>
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
                            placeholder="Enter your password"
                            label="Password"
                            name="password"
                            value={values.password}
                            handleChange={handleChange}
                            handleBlur={handleBlur}
                            errors={errors}
                            touched={touched}
                        />
                        <div className="forgotPass">
                            <Link to={"/auth/forgot-password"}>
                                Forgot Password?
                            </Link>
                        </div>
                        <CustomButton
                            text={"Log In"}
                            isSubmitting={isSubmitting}
                        />
                    </form>
                )}
            </Formik>
            <p className="helper">
                Don't have an account?{" "}
                <strong>
                    <Link to={"/auth/signup"}>Sign Up</Link>
                </strong>
            </p>
        </>
    );
};

export default LoginForm;
