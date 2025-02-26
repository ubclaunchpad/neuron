import RightSideWithForm from "../../components/AuthenticationFormWrapper";
import LeftSideBarWithLogo from "../../components/LeftSideBarWithLogo";
import "./index.css";

const ResetPassword = () => {
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

export default ResetPassword;
