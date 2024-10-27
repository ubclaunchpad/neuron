import LeftSideBarWithLogo from "../../components/LeftSideBarWithLogo";
import RightSideWithForm from "../../components/RightSideWithForm";
import "./index.css";

const ResetPasswordPage = () => {
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

export default ResetPasswordPage;
