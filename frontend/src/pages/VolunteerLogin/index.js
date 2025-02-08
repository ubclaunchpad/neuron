import RightSideWithForm from "../../components/AuthenticationFormWrapper";
import LeftSideBarWithLogo from "../../components/LeftSideBarWithLogo";
import "./index.css";

const VolunteerLogin = () => {
    return (
        <div className="loginPage">
            <LeftSideBarWithLogo />
            <RightSideWithForm type={"login"} heading={"Welcome!"} />
        </div>
    );
};

export default VolunteerLogin;
