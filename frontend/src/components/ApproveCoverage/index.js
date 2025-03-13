import "./index.css";
import React, { useState, useEffect } from "react";
import CloseIcon from "@mui/icons-material/Close";

export default function ApproveCoverage({ shift, setApprove, handleApprove }) {
  return (
    <form className="approve-coverage">
      <div className="approve-coverage-header">
        <h2 className="approve-coverage-title">Approve Coverage</h2>
        <div
          className="close-modal-btn"
          onClick={() => {
            setApprove(false);
          }}
        >
          <CloseIcon />
        </div>
      </div>
      <div>
        Which requests do you want to approve?{" "}
        <span className="required-field-text">
          {"("}Required{")"}
        </span>
      </div>
      <div className="approve-coverage-options">
        <div className="approve-coverage-option">
          <input type="checkbox" className="approve-coverage-checkbox" />
          <span>This Session Only</span>
        </div>
        <div className="approve-coverage-option">
          <input
            type="checkbox"
            className="approve-coverage-checkbox"
            disabled
          />
          <span>This and future sessions</span>
        </div>
      </div>
      <div className="approve-coverage-initials-label">
        Your admin initials {"("}for logging purposes{")"}{" "}
        <span className="required-field-text">
          {"("}Required{")"}
        </span>
      </div>
      <div className="approve-coverage-inputs">
        <input
          type="text"
          placeholder="MU"
          className="approve-coverage-initials"
          required
        />
      </div>
      <div
        className="approve-coverage-button"
        onClick={() => {
          handleApprove(shift);
        }}
      >
        Approve
      </div>
    </form>
  );
}
