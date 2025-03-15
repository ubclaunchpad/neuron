import React from "react";
import { Modal } from "react-responsive-modal";
import "react-responsive-modal/styles.css";
import RequestImage from "../../assets/request-sent.png";
import "./index.css";

const AbsenceRequestConfirmation = ({ open, onClose }) => {
  return (
    <Modal open={open} onClose={onClose} center classNames={{ modal: "confirmation-modal" }}>
      <img className="confirmation-modal-child" alt="" src= { RequestImage } />
      <div className="request-sent-parent">
        <div className="request-sent">Request sent</div>
        <div className="your-request-is-container">
          <p className="your-request-is">
            Your request is with the admin for review.
          </p>
          <p className="your-request-is">
            You'll be notified once a decision is made.
          </p>
        </div>
      </div>
      <div className="confirmation-modal-button" onClick={onClose}>
        <div className="button1">OK</div>
      </div>
    </Modal>
  );
};

export default AbsenceRequestConfirmation;
