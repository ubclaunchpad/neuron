import SignUpForm from "../SignUpForm";
import LoginForm from "../LoginForm";
import "./index.css";

const RightSideWithForm = ({ type }) => {
    return (
        <div className="rightSideWithForm">
            <div className="welcomeHeading">
                <h1>Welcome!</h1>
            </div>
            {type === "login" && <LoginForm />}
            {type === "signup" && <SignUpForm />}
        </div>
    );
};

export default RightSideWithForm;
