import LeftSideBarWithLogo from "../../components/LeftSideBarWithLogo";
import RightSideWithForm from "../../components/AuthenticationFormWrapper";
import "./index.css";

const VolunteerForgotPassword = () => {
    return (
        <div className="forgotPassPage">
            <LeftSideBarWithLogo />
            <RightSideWithForm
                type={"forgotPass"}
                heading={"Reset your password"}
                subHeading={
                    "Enter the email address you used to register with."
                }
            />
        </div>
    );
};

export default VolunteerForgotPassword;
