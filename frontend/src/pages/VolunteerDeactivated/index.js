import React from 'react';
import { useAuth } from "../../contexts/authContext";
import deactivatedImg from "./acct-deactivated-img.png";
import logoutIcon from "./button-icon.png";
import './index.css';

function VolunteerDeactivated() {
  const { logout } = useAuth();

  return (
    <div className="account-verification-page">
      <div className="account-verification-content">
        <img
          src={deactivatedImg}
          alt="Account deactivated"
          className="deactivated-image"
        />
        <h2><b>Your account has been deactivated.</b></h2>
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


export default VolunteerDeactivated;