import TextInput from "../TextInput";
import CustomButton from "../CustomButton";
import { Link } from "react-router-dom";
import { useRef, useState } from "react";
import { Formik } from "formik";
import * as Yup from "yup";
import { useTimer } from "react-timer-hook";
import { sendResetPasswordInstructions } from "../../api/auth";
import notyf from "../../utils/notyf";
import "./index.css";

const ForgotPassSchema = Yup.object().shape({
    email: Yup.string()
        .email("Please enter a valid email address.")
        .required("Please fill out this field."),
});

const ForgotPassForm = ({ setNewHeading, setNewSubHeading }) => {
    const formRef = useRef();
    const [hideForm, setHideForm] = useState(false);
    const [showResendButton, setShowResendButton] = useState(false);
    const [email, setEmail] = useState("");
    const { minutes, seconds, restart } = useTimer({
        onExpire: () => {
            setShowResendButton(true);
        },
    });

    return (
        <>
            <Formik
                initialValues={{
                    email: "",
                }}
                validationSchema={ForgotPassSchema}
                onSubmit={(values, { setSubmitting }) => {
                    sendResetPasswordInstructions(values)
                        .then((response) => {
                            notyf.success("Instructions sent successfully.");
                            setEmail(values.email);
                            setNewHeading("Check your mail");
                            setNewSubHeading(
                                `We have sent the password reset instructions to <b>${values.email}</b>.`
                            );
                            setHideForm(true);
                            restart(new Date().getTime() + 1000 * 59);
                        })
                        .catch((error) => {
                            console.error(error);
                            notyf.error(error.response.data.error);
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
                    <>
                        {!hideForm && (
                            <form
                                ref={formRef}
                                className="forgotPassForm"
                                onSubmit={handleSubmit}>
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
                                <br />
                                <CustomButton
                                    text={"Send Instructions"}
                                    isSubmitting={isSubmitting}
                                />
                            </form>
                        )}
                        {hideForm && (
                            <div className="forgotPassForm">
                                <p className="helperTextAfterForgotSubmit">
                                    Did not receive the email? Check your spam
                                    folder or click below to resend
                                    instructions.
                                </p>
                                {showResendButton && (
                                    <button
                                        className="resendButton"
                                        onClick={() => {
                                            sendResetPasswordInstructions({
                                                email,
                                            })
                                                .then((response) => {
                                                    notyf.success(
                                                        "Instructions sent successfully."
                                                    );
                                                    setShowResendButton(false);
                                                    // reset timer
                                                    restart(
                                                        new Date().getTime() +
                                                            1000 * 59
                                                    );
                                                })
                                                .catch((error) => {
                                                    console.error(error);
                                                    notyf.error(
                                                        error.response.data
                                                            .error
                                                    );
                                                });
                                        }}>
                                        Resend Instructions
                                    </button>
                                )}
                                {!showResendButton && (
                                    <div className="timer">
                                        <p>
                                            {minutes}
                                            {0} :{" "}
                                            {
                                                // format the seconds to have a leading zero
                                                seconds < 10
                                                    ? `0${seconds}`
                                                    : seconds
                                            }
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </Formik>
            <p className="forgot-helper">
                <lord-icon
                    id="go-back-icon"
                    src="https://cdn.lordicon.com/rmkahxvq.json"
                    trigger="hover"
                    style={{ width: "1.5vw", height: "1.5vw" }}></lord-icon>
                <Link to={"/auth/login"}>Back to log in</Link>
            </p>
        </>
    );
};

export default ForgotPassForm;
