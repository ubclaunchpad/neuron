import React from "react";
import "./index.css";
import { useAuth } from "../../contexts/authContext";

function AdminProfile() {
    const { logout } = useAuth();

    return (
        <main className="admin-profile-container">
            <div className="admin-header">
                <h2 className="admin-title">Admin Profile</h2>
                <button className="logout-button" onClick={logout}>
                    <i className="fa-solid fa-arrow-right-from-bracket"></i>&nbsp;&nbsp;Log Out
                </button>
            </div>
        </main>
    );
}

export default AdminProfile;
