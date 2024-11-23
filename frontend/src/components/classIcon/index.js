import React from "react";
import "./index.css";

function ClassIcon({ imageUrl, level, title, time }) {
  return (
    <div className="class-icon-card">
      <img src={imageUrl} alt="Class" className="class-image" />
      <div className="class-details">
        <p className="class-level">{level}</p>
        <h3 className="class-title">{title}</h3>
        <p className="class-time">{time}</p>
      </div>
    </div>
  );
}

export default ClassIcon;
