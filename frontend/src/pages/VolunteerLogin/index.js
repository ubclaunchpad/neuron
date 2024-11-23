import LeftSideBarWithLogo from "../../components/LeftSideBarWithLogo";
import RightSideWithForm from "../../components/AuthenticationFormWrapper";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isAuthenticated } from "../../api/authService";
import "./index.css";

const VolunteerLogin = () => {
    const navigate = useNavigate();

    useEffect(() => {
        isAuthenticated().then((response) => {
            if (response.isAuthenticated) {
                navigate("/");
            }
        }).catch((error) => {
            console.error(error);
        });
        // eslint-disable-next-line
    }, []);

    return (
        <div className="loginPage">
            <LeftSideBarWithLogo />
            <RightSideWithForm type={"login"} heading={"Welcome!"} />
        </div>
    );
};

export default VolunteerLogin;
