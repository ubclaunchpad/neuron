import LeftSideBarWithLogo from "../../components/LeftSideBarWithLogo";
import RightSideWithForm from "../../components/RightSideWithForm";
import "./index.css";

const ForgotPasswordPage = () => {
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

export default ForgotPasswordPage;
