import RightSideWithForm from "../../components/AuthenticationFormWrapper";
import LeftSideBarWithLogo from "../../components/LeftSideBarWithLogo";
import "./index.css";

const ForgotPassword = () => {
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

export default ForgotPassword;
