import "./index.css";
import React, {useEffect} from "react";
import ReactDOM from "react-dom";
import close_button from "../../assets/images/button-icons/button-icon-close.png";

function Modal ({ isOpen, onClose, children, title, width, height }) {

     if (!isOpen) {
          return null;
     } 
     
     return ReactDOM.createPortal(
          <div className="modal-overlay" >
               <div className="modal-content" style={{width: width, height: height}}>
                    <div className="modal-header">
                         <h2 className="modal-title">{title ? title : ""}</h2>
                         <img className="close-button" onClick={onClose} src={close_button}/>
                    </div>
                    {children}
               </div>
          </div>,
          document.getElementById("modal-root") 
     );
};

export default Modal;

