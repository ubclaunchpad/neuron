import React, { useState } from 'react';
import './index.css';
import logoutIcon from "./button-icon.png";
import notVerifiedImg from "./not-verified-img.png";
import { useAuth } from "../../contexts/authContext";


function VolunteerNotVerified() {

  const { logout } = useAuth();

  const logoutRedirect = () => {
    logout();
    window.location.href = "/auth/login";
  };


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
        <button className = "account-verification-button" onClick={logoutRedirect}>
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