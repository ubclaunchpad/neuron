import React from "react";
import "./index.css";
import loadingImage from "../../assets/images/bc_brain_logo.png"

function LoadingIcon() {
  return (
    <div className="loading-icon">
      <img src={loadingImage} alt="Loading..." className="loading-image"/>
    </div>
  );
}

export default LoadingIcon;
