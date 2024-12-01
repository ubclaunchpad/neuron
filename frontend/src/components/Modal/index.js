import React from "react";
import "./index.css"; // Import custom styles

const Modal = ({ closeModal, modalContent}) => {
  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {modalContent}
        <button onClick={closeModal} className="close-btn">&times;</button>
      </div>
    </div>
  );
};

export default Modal;