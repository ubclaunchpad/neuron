import React from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { changePassword } from "../../../api/authService";
import "./index.css";

function ChangePasswordCard({ volunteer }) {
    
    const [passwordForm, setPassword] = React.useState({
        current: "",
        new: "",
        confirm: ""
    })
    const [showPasswordForm, setShowPasswordForm] = React.useState({
        current: false,
        new: false,
        confirm: false,
    });
    const [success, setSuccess] = React.useState("");

    
    const togglePasswordVisibility = (field) => {
        setShowPasswordForm((prevState) => ({
            ...prevState,
            [field]: !prevState[field],
        }));
    };

    const handleChange = (e) => {
        const {name, value} = e.target;
        setPassword({
            ...passwordForm,
            [name]: value
        })
    }

    const handleSubmit = async (e) => {
        console.log("clicked")
        e.preventDefault();
        if (passwordForm.new !== passwordForm.confirm) {
            console.error("Passwords must match.");
            return;
        }
        try {
            const data = await changePassword({
                currentPassword: passwordForm.current,
                newPassword: passwordForm.new
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
                            type={showPasswordForm.current ? 'text' : 'password'}
                            placeholder="Enter your current password"
                            name="current"
                            value={passwordForm.current}
                            onChange={handleChange}
                        />
                        <span
                            className="password-toggle"
                            onClick={() => togglePasswordVisibility('current')}
                        >
                            {showPasswordForm.current ? <FaEyeSlash /> : <FaEye />}
                        </span>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>New Password</label>
                        <div className="input-wrapper">
                        <input
                            type={showPasswordForm.new ? 'text' : 'password'}
                            placeholder="Enter your new password"
                            name="new"
                            value={passwordForm.new}
                            onChange={handleChange}
                        />
                        <span
                            className="password-toggle"
                            onMouseDown={() => togglePasswordVisibility('new')}
                        >
                            {showPasswordForm.new ? <FaEyeSlash /> : <FaEye />}
                        </span>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Confirm New Password</label>
                        <div className="input-wrapper">
                        <input
                            type={showPasswordForm.confirm ? 'text' : 'password'}
                            placeholder="Confirm your new password"
                            name="confirm"
                            value={passwordForm.confirm}
                            onChange={handleChange}
                        />
                        <span
                            className="password-toggle"
                            onClick={() => togglePasswordVisibility('confirm')}
                        >
                            {showPasswordForm.confirm ? <FaEyeSlash /> : <FaEye />}
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