import "./index.css";
import React, {useEffect} from "react";
import ReactDOM from "react-dom";
import close_button from "../../assets/images/button-icons/button-icon-close.png";

function Modal ({ isOpen, onClose, children, width, height }) {

     if (!isOpen) {
          return null;
     } 
     
     return ReactDOM.createPortal(
          <div className="modal-overlay" >
               <div className="modal-content" style={{width: width, height: height}}>
                    <img className="close-button" onClick={onClose} src={close_button}/>
                    {children}
               </div>
          </div>,
          document.getElementById("modal-root") 
     );
};

export default Modal;

