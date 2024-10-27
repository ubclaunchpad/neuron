import TextInput from "../TextInput";
import CustomButton from "../CustomButton";
import { Link } from "react-router-dom";
import "./index.css";

const ForgotPassForm = () => {
    return (
        <div className="forgotPassForm">
            <TextInput
                type="email"
                placeholder="Enter your email"
                label="Email"
            />
            <br />
            <CustomButton text={"Send Instructions"} />
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

export default ForgotPassForm;
