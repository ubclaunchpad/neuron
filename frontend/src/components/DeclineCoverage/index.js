import "./index.css";
import React, { useState, useEffect } from "react";
import CloseIcon from "@mui/icons-material/Close";

export default function DeclineCoverage({ shift, setDecline, handleDecline }) {
  return (
    <form className="decline-coverage">
      <div className="decline-coverage-header">
        <h2 className="decline-coverage-title">Decline Coverage</h2>
        <div
          className="close-modal-btn"
          onClick={() => {
            setDecline(false);
          }}
        >
          <CloseIcon />
        </div>
      </div>
      <div>
        Which requests do you want to decline?{" "}
        <span className="required-field-text">
          {"("}Required{")"}
        </span>
      </div>
      <div className="decline-coverage-options">
        <div className="decline-coverage-option">
          <input type="checkbox" className="decline-coverage-checkbox" />
          <span>This Session Only</span>
        </div>
        <div className="decline-coverage-option">
          <input
            type="checkbox"
            className="decline-coverage-checkbox"
            disabled
          />
          <span>This and future sessions</span>
        </div>
      </div>
      <div className="decline-coverage-initials-label">
        Your admin initials {"("}for logging purposes{")"}{" "}
        <span className="required-field-text">
          {"("}Required{")"}
        </span>
      </div>
      <div className="decline-coverage-inputs">
        <input
          type="text"
          placeholder="MU"
          className="decline-coverage-initials"
          required
        />
      </div>
      <div
        className="decline-coverage-button"
        onClick={() => {
          handleDecline(shift);
        }}
      >
        Decline
      </div>
    </form>
  );
}
