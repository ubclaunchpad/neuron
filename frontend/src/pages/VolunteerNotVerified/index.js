import React from 'react';
import { useAuth } from "../../contexts/authContext";
import logoutIcon from "./button-icon.png";
import './index.css';
import notVerifiedImg from "./not-verified-img.png";


function VolunteerNotVerified() {
  const { logout } = useAuth();
  
  return (
    <div className="account-verification-page">
      <div className="account-verification-content">
        <img
          src={notVerifiedImg}
          alt="Account verification pending"
          className="not-verified-image"
        />
        <h2><b>Waiting for an admin to verify your account.</b></h2>
        <div className="account-verification-contact-text">You can reach out to us at <b>bwp@gmail.com</b>. </div>
        <button className = "account-verification-button" onClick={logout}>
          <img
            src={logoutIcon}
            alt="Log out icon"
            style={{ width: '14px', height: '14px', marginRight: '8px', marginTop: '1px' }}
          />
          Log Out
        </button>

      </div>
    </div>
  );
}


export default VolunteerNotVerified;