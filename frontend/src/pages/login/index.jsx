import LeftSideBarWithLogo from "../../components/LeftSideBarWithLogo";
import RightSideWithForm from "../../components/RightSideWithForm";
import "./index.css";

const LoginPage = () => {
    return (
        <div className="loginPage">
            <LeftSideBarWithLogo />
            <RightSideWithForm type={"login"} />
        </div>
    );
};

export default LoginPage;
