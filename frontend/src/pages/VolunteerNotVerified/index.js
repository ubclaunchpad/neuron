import React, { useState } from 'react';
import './index.css';
import logoutIcon from "./logout.png";


function VolunteerNotVerified() {
  //const [data, setData] = useState(null);


  const logOut = () => {
    localStorage.removeItem("neuronAuthToken");
    window.location.href = "/auth/login";
  };


  return (
    <div className="account-not-verified-page">
      <h2>Waiting for an admin to verify your account.</h2>
      <div>You can reach out to us at <b>bwp@gmail.com</b>. </div>
      <button className = "account-not-verified-button" onClick={logOut}>
        <img
          src={logoutIcon}
          alt="Log out icon"
          style={{ width: '14px', height: '14px', marginRight: '8px', marginTop: '1px' }}
        />
        Log Out
      </button>


    </div>
  );
}


export default VolunteerNotVerified;