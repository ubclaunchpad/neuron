import TextInput from "../TextInput";
import CustomButton from "../CustomButton";
import { Link } from "react-router-dom";
import "./index.css";

const LoginForm = () => {
    return (
        <div className="loginForm">
            <TextInput
                type="email"
                placeholder="Enter your email"
                label="Email"
            />
            <TextInput
                type="password"
                placeholder="Enter your password"
                label="Password"
            />
            <div className="forgotPass">
                <Link to={"/auth/forgot-password"}>Forgot Password?</Link>
            </div>
            <CustomButton text={"Log In"} />
            <p className="helper">
                Don't have an account?{" "}
                <strong>
                    <Link to={"/auth/signup"}>Sign Up</Link>
                </strong>
            </p>
        </div>
    );
};

export default LoginForm;
