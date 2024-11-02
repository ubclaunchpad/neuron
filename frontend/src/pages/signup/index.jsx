import LeftSideBarWithLogo from "../../components/LeftSideBarWithLogo";
import RightSideWithForm from "../../components/RightSideWithForm";
import "./index.css";

const SignUpPage = () => {
    return (
        <div className="signUpPage">
            <LeftSideBarWithLogo />
            <RightSideWithForm type={"signup"} heading={"Welcome!"} />
        </div>
    );
};

export default SignUpPage;