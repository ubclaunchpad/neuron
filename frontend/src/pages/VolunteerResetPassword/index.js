import LeftSideBarWithLogo from "../../components/LeftSideBarWithLogo";
import RightSideWithForm from "../../components/AuthenticationFormWrapper";
import "./index.css";

const VolunteerResetPassword = () => {
    return (
        <div className="forgotPassPage">
            <LeftSideBarWithLogo />
            <RightSideWithForm
                type={"resetPass"}
                heading={"Set your new password"}
            />
        </div>
    );
};

export default VolunteerResetPassword;
