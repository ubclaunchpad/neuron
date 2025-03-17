import { Formik } from "formik";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as Yup from "yup";
import { resetPassword } from "../../api/authService";
import notyf from "../../utils/notyf";
import CustomButton from "../CustomButton";
import TextInput from "../TextInput";
import "./index.css";

const ResetPassSchema = Yup.object().shape({
    password: Yup.string()
        .min(8, "Password must be at least 8 characters long.")
        .required("Please fill out this field."),
    confirmPassword: Yup.string()
        .oneOf([Yup.ref("password"), null], "Passwords don't match.")
        .required("Please fill out this field."),
});

const ResetPasswordForm = () => {
    const [id, setId] = useState("");
    const [token, setToken] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        // Get the id and token from the URL queries
        const urlParams = new URLSearchParams(window.location.search);

        if (!urlParams.has("id") || !urlParams.has("token")) {
            navigate("/auth/login");
        }

        setId(urlParams.get("id"));
        setToken(urlParams.get("token"));
    }, []);

    return (
        <>
            <Formik
                initialValues={{
                    password: "",
                    confirmPassword: "",
                }}
                validationSchema={ResetPassSchema}
                onSubmit={(values, { setSubmitting }) => {
                    // Remove confirm password from the data
                    delete values.confirmPassword;
                    resetPassword({ ...values, id, token })
                        .then(() => {
                            notyf.success("Password reset successfully.");
                            setTimeout(() => {
                                navigate("/auth/login");
                            }, 2500);
                        })
                        .catch((error) => {
                            notyf.error(error.response.data.error);
                            console.error(error);
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
                    <form className="resetPassForm" onSubmit={handleSubmit}>
                        <TextInput
                            type="password"
                            placeholder="Create a new password"
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
                            text={"Reset Password"}
                            isSubmitting={isSubmitting}
                        />
                    </form>
                )}
            </Formik>
        </>
    );
};

export default ResetPasswordForm;
