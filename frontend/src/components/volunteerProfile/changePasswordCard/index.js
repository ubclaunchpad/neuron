import "./index.css";
import React from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { changePassword } from "../../../api/authService";

function ChangePasswordCard({ volunteer }) {
    
    const [password, setPassword] = React.useState({
        current: "",
        new: "",
        confirm: ""
    })
    const [showPassword, setShowPassword] = React.useState({
        current: false,
        new: false,
        confirm: false,
    });
    const [success, setSuccess] = React.useState("");

    
    const togglePasswordVisibility = (field) => {
        setShowPassword((prevState) => ({
            ...prevState,
            [field]: !prevState[field],
        }));
    };

    const handleChange = (e) => {
        const {name, value} = e.target;
        setPassword({
            ...password,
            [name]: value
        })
    }

    const handleSubmit = async (e) => {
        console.log("clicked")
        e.preventDefault();
        if (password.new !== password.confirm) {
            console.error("Passwords must match.");
            return;
        }
        try {
            const data = await changePassword({
                email: volunteer.email,
                currentPassword: password.current,
                newPassword: password.new
            })
            setSuccess(data.message);
        } catch (error) {
            setSuccess(error.toString());
            console.error(error);
        }
    }
    
    return (
        <div className="change-password-card-container">
            <div className="change-password-card">
                <h2>Change Password</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Current Password</label>
                        <div className="input-wrapper">
                        <input
                            type={showPassword.current ? 'text' : 'password'}
                            placeholder="Enter your current password"
                            name="current"
                            value={password.current}
                            onChange={handleChange}
                        />
                        <span
                            className="password-toggle"
                            onClick={() => togglePasswordVisibility('current')}
                        >
                            {showPassword.current ? <FaEyeSlash /> : <FaEye />}
                        </span>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>New Password</label>
                        <div className="input-wrapper">
                        <input
                            type={showPassword.new ? 'text' : 'password'}
                            placeholder="Enter your new password"
                            name="new"
                            value={password.new}
                            onChange={handleChange}
                        />
                        <span
                            className="password-toggle"
                            onMouseDown={() => togglePasswordVisibility('new')}
                        >
                            {showPassword.new ? <FaEyeSlash /> : <FaEye />}
                        </span>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Confirm New Password</label>
                        <div className="input-wrapper">
                        <input
                            type={showPassword.confirm ? 'text' : 'password'}
                            placeholder="Confirm your new password"
                            name="confirm"
                            value={password.confirm}
                            onChange={handleChange}
                        />
                        <span
                            className="password-toggle"
                            onClick={() => togglePasswordVisibility('confirm')}
                        >
                            {showPassword.confirm ? <FaEyeSlash /> : <FaEye />}
                        </span>
                        </div>
                    </div>
                    <div><p>{success}</p></div>
                    <button 
                        type="submit" 
                        className="change-password-btn"
                    >
                        Change Password
                    </button>
                </form>
            </div>
        </div>
    );
}

export default ChangePasswordCard;