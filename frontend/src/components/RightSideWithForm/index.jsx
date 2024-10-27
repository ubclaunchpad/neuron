import SignUpForm from "../SignUpForm";
import LoginForm from "../LoginForm";
import ForgotPassForm from "../ForgotPassForm";
import ResetPasswordForm from "../ResetPasswordForm";
import "./index.css";

const RightSideWithForm = ({ type, heading, subHeading = "" }) => {
    return (
        <div className="rightSideWithForm">
            <div className="welcomeHeading">
                <h1>{heading}</h1>
                {subHeading.length > 0 && <p>{subHeading}</p>}
            </div>
            {type === "login" && <LoginForm />}
            {type === "signup" && <SignUpForm />}
            {type === "forgotPass" && <ForgotPassForm />}
            {type === "resetPass" && <ResetPasswordForm />}
        </div>
    );
};

export default RightSideWithForm;
