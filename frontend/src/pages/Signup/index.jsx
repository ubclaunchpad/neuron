import RightSideWithForm from "../../components/AuthenticationFormWrapper";
import LeftSideBarWithLogo from "../../components/LeftSideBarWithLogo";
import "./index.css";

const Signup = () => {
    return (
        <div className="signUpPage">
            <LeftSideBarWithLogo />
            <RightSideWithForm type={"signup"} heading={"Welcome!"} />
        </div>
    );
};

export default Signup;
