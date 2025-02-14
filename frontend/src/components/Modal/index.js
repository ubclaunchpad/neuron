import "./index.css";
import React from "react";
import ReactDOM from "react-dom";
import close_button from "../../assets/images/button-icons/button-close-icon.png";

function Modal ({ isOpen, onClose, children, width, height }) {

     if (!isOpen) {
          return null;
     } 
     
     return ReactDOM.createPortal(
          <div className="modal-overlay" >
               <div className="modal-content" style={{width: width, height: height}}>
                    <img alt="Close Icon" className="close-button" onClick={onClose} src={close_button}/>
                    {children}
               </div>
          </div>,
          document.getElementById("modal-root") 
     );
};

export default Modal;

