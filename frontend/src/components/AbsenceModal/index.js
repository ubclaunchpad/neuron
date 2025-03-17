import "./index.css";
import React, { useState, useEffect } from "react";
import CloseIcon from "@mui/icons-material/Close";

export default function AbsenceModal({ shift, setShowModal, handleApprove, handleDecline, approve }) {
  const [initials, setInitials] = useState("");
  const [checked, setChecked] = useState(false);
  const handleSubmit = (e) => {
    e.preventDefault();
    setShowModal(false);
    if (approve) {
      handleApprove(shift);
    } else {
      handleDecline(shift);
    }
  }
  return (
    <form className="approve-coverage" onSubmit={handleSubmit}>
      <div className="approve-coverage-header">
        <h2 className="approve-coverage-title">
          {approve ? "Approve" : "Decline"} Absence
        </h2>
        <div
          className="close-modal-btn"
          onClick={() => {
            setShowModal(false);
          }}
        >
          <CloseIcon />
        </div>
      </div>
      <div>
        Which requests do you want to {approve ? "approve" : "decline"}?{" "}
        <span className="required-field-text">
          {"("}Required{")"}
        </span>
      </div>
      <div className="approve-coverage-options">
        <div className="approve-coverage-option">
          <input
            type="checkbox"
            className="approve-coverage-checkbox"
            onChange={(e) => {
              if (e.target.checked) {
                setChecked(true);
              } else {
                setChecked(false);
              }
            }}
          />
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
          value={initials}
          onChange={(e) => setInitials(e.target.value)}
          required
        />
      </div>
      <button
        className={
          approve ? "approve-coverage-button" : "decline-coverage-button"
        }
        type="submit"
        disabled={initials.length !== 2 || !checked}
      >
        {approve ? "Approve" : "Decline"}
      </button>
    </form>
  );
}