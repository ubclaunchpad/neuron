import TextInput from "../TextInput";
import CustomButton from "../CustomButton";
import { Link } from "react-router-dom";
import "./index.css";

const ResetPasswordForm = () => {
    return (
        <div className="resetPassForm">
            <TextInput
                type="password"
                placeholder="Create a new password"
                label="Create Password"
            />
            <TextInput
                type="password"
                placeholder="Confirm your password"
                label="Confirm Password"
            />
            <CustomButton text={"Reset Password"} />
            <p className="forgot-helper">
                <lord-icon
                    id="go-back-icon"
                    src="https://cdn.lordicon.com/rmkahxvq.json"
                    trigger="hover"
                    style={{ width: "2vw", height: "2vw" }}></lord-icon>
                <Link to={"/auth/login"}>Back to log in</Link>
            </p>
        </div>
    );
};

export default ResetPasswordForm;
