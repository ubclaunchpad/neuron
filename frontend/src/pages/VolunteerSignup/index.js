import LeftSideBarWithLogo from "../../components/LeftSideBarWithLogo";
import RightSideWithForm from "../../components/AuthenticationFormWrapper";
import "./index.css";

const VolunteerSignup = () => {
    return (
        <div className="signUpPage">
            <LeftSideBarWithLogo />
            <RightSideWithForm type={"signup"} heading={"Welcome!"} />
        </div>
    );
};

export default VolunteerSignup;
