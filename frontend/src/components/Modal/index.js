import "./index.css";
import React from "react";
import ReactDOM from "react-dom";
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

function Modal ({ title = "", isOpen, onClose, children, width, height }) {

     if (!isOpen) {
          return null;
     } 
     
     return ReactDOM.createPortal(
          <div className="modal-overlay" >
               <div className="modal-content" style={{width: width, height: height}}>
                    <div className="modal-header">
                         <h2>{title}</h2>
                         <CloseRoundedIcon sx={{color: "#808080"}} className="close-button" onClick={onClose} />
                    </div>
                    {children}
               </div>
          </div>,
          document.getElementById("modal-root") 
     );
};

export default Modal;

