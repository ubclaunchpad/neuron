import TextInput from "../TextInput";
import CustomButton from "../CustomButton";
import { Link } from "react-router-dom";
import "./index.css";

const SignUpForm = () => {
    return (
        <div className="signUpForm">
            <div className="twoInputs">
                <TextInput
                    type="text"
                    placeholder="Enter your first name"
                    label="First Name"
                />
                <TextInput
                    type="text"
                    placeholder="Enter your last name"
                    label="Last Name"
                />
            </div>
            <TextInput
                type="email"
                placeholder="Enter your email"
                label="Email"
            />
            <TextInput
                type="password"
                placeholder="Create a password"
                label="Create Password"
            />
            <TextInput
                type="password"
                placeholder="Confirm your password"
                label="Confirm Password"
            />
            <CustomButton text={"Create an Account"} />
            <p className="helper">
                Already have an account?{" "}
                <strong>
                    <Link to={"/auth/login"}>Sign Up</Link>
                </strong>
            </p>
        </div>
    );
};

export default SignUpForm;
