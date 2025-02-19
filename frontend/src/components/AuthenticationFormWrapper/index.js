import SignUpForm from "../SignUpForm";
import LoginForm from "../LoginForm";
import ForgotPassForm from "../ForgotPassForm";
import ResetPasswordForm from "../ResetPasswordForm";
import { useState } from "react";
import "./index.css";

const RightSideWithForm = ({ type, heading, subHeading = "" }) => {
    const [newHeading, setNewHeading] = useState(heading);
    const [newSubHeading, setNewSubHeading] = useState(subHeading);

    return (
        <div className="rightSideWithForm">
            <div className="welcomeHeading">
                <h1>{newHeading}</h1>
                {newSubHeading.length > 0 && (
                    <p dangerouslySetInnerHTML={{ __html: newSubHeading }} />
                )}
            </div>
            {type === "login" && <LoginForm />}
            {type === "signup" && <SignUpForm />}
            {type === "forgotPass" && (
                <ForgotPassForm
                    setNewHeading={setNewHeading}
                    setNewSubHeading={setNewSubHeading}
                />
            )}
            {type === "resetPass" && <ResetPasswordForm />}
        </div>
    );
};

export default RightSideWithForm;