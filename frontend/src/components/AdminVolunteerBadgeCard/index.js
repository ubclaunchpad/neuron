import "./index.css";
import React, {useState, useEffect } from 'react';
import edit_icon from "../../assets/edit-icon.png";
import delete_icon from "../../assets/delete-icon.png";
import activate_icon from "../../assets/checked-in.png";
import Modal from "../Modal";
import init_warning from "../../assets/admin-initial-warning.png";
import { verifyVolunteer, deactivateVolunteer, denyVolunteer } from "../../api/volunteerService";
import notyf from "../../utils/notyf";
import { useNavigate } from "react-router-dom";



function AdminVolunteerBadgeCard ({volunteer}) {
     const navigate = useNavigate();
     const NEW_VOLUNTEER_MONTH = 3;
     const [showMenu, setShowMenu] = useState(false);
     const [statusModalTitle, setStatusModalTitle] = useState(null);
     const [showStatusModal, setShowStatusModal] = useState(false);
     const [isValidInitials, setIsValidInitials] = useState(null);
     const [adminInit, setAdminInit] = useState("");
     const [statusCode, setStatusCode] = useState(null); // 0: Reactivating; 1: Deactivating; 2: Deleting;


     function isNewVolunteer () {
          if (!volunteer || !volunteer.created_at ) return null;
          const created_at = new Date(volunteer.created_at);
          const now = new Date();
          const diff = (now.getTime() - created_at.getTime()) / (1000 * 60 * 60 * 24 * 30);
          if (diff <= NEW_VOLUNTEER_MONTH) 
               return (
                    <span className={`badge badge-status new-volunteer`}>New Volunteer</span>
               );
          return null;
     };

     function renderStatusButton() {
          if (volunteer.status == 'inactive') {
               return (
                    <button 
                         className="deactivate-reactivate-btn reactivate-btn"
                         onClick={()=> {
                              setStatusCode(0);
                              setStatusModalTitle("Reactivate Account");
                              setShowMenu(false);
                              setShowStatusModal(true);
                         }}
                    >
                         <img src={activate_icon}/> Reactivate Volunteer
                    </button>
               );
          } else if (volunteer.status == 'active') {
               return (
                    <button 
                         className="deactivate-reactivate-btn"
                         onClick={()=> {
                              setStatusCode(1);
                              setStatusModalTitle("Deactivate Account");
                              setShowMenu(false);
                              setShowStatusModal(true);
                         }}>
                         <img src={delete_icon}/> Deactivate Volunteer
                    </button>
               );
          } else {
               return (<span>
                   This volunteer is currently unverified. If you want to verify this volunteer, please navigate to the Member Management tab.
               </span>)
          }
     }

     async function isInitialValid() {
          const valid = /^[a-zA-Z]\.?[a-zA-Z]\.?$/.test(adminInit.trim());
          setIsValidInitials(!valid);
          if (valid) {
               if (statusCode == 0) {
                    try {
                         await verifyVolunteer(volunteer.volunteer_id, adminInit.trim()); 
                         notyf.success("Account reactivated!");
                         navigate(0);
                    } catch {(error) => {
                         notyf.error("Failed to reactivate volunteer's account.");
                         console.error(error);
                    }};
               } else if (statusCode == 1) {
                    deactivateVolunteer(volunteer.volunteer_id, adminInit.trim())
                    .then(() => {
                         notyf.success("Account deactivated!");
                         navigate(0);
                    })
                    .catch((error) => {
                         notyf.error("Failed to deactivate volunteer's account.");
                         console.error(error);
                    });
               } else {
                    try {
                         await denyVolunteer(volunteer.volunteer_id, adminInit.trim());
                         notyf.success("Account removed!");
                         navigate("/management");
                    } catch {(error) => {
                         notyf.error("Failed to deleting volunteer's account.");
                         console.error(error);
                    }};
               }
          }
     }

     return (
          <>
               <div className="admin-vol-badge-ctn"> 
                    <div className="edit-btn-ctn">
                         <img 
                              className="edit-volunteer-btn" 
                              alt="Edit icon" 
                              src={edit_icon}
                              onClick={() => setShowMenu(!showMenu)}
                         />
                         {
                              showMenu && (
                                   <div className="status-card-menu">
                                        {renderStatusButton()}
                                        <button 
                                             type="button" 
                                             className="delete-account-btn"
                                             onClick={()=> {
                                                  setStatusCode(2);
                                                  setStatusModalTitle("Deleting Account");
                                                  setShowMenu(false);
                                                  setShowStatusModal(true);
                                             }}
                                        >
                                             Delete Volunteer
                                        </button>
                                   </div>
                              )
                         }
                    </div>

                    <h2 className="dash-card-title">Status</h2>
                    <br/>
                    {volunteer.status === 'active' ? 
                         <span className={`badge badge-status active`}>Active</span>
                    : null} 
                    {volunteer.status === 'inactive' ? 
                         <span className={`badge badge-status inactive`}>Inactive</span>
                    : null}
                    {volunteer.status === 'unverified' ? 
                         <span className={`badge badge-status unverified`}>Unverified</span>
                    : null}
                    <span className={`badge badge-role regular-volunteer`}>Regular Volunteer</span>
                    {isNewVolunteer()}
               </div>

               <Modal
                    title={statusModalTitle}
                    isOpen={showStatusModal}
                    onClose={() => {
                         setShowStatusModal(false);
                         setIsValidInitials(null);
                    }}
                    width={"500px"}
                    height={"fit-content"}
               >
                    <div className={`status-modal-desc ${ statusCode==0 && "is-reactivating"}`}>
                         {statusCode==0 ? 
                              <div>Re-activating this account will mark the account as <span>Active</span>. This will restore access for the volunteer, allowing them to sign in and volunteer for classes again.</div> : 
                              (statusCode==1 ? 
                              <div>Deactivating this account will mark the account as <span>Inactive</span>. This volunteer will no longer be able to sign in or volunteer for classes until their account is reactivated.</div> : 
                              <div>Deleting this account will remove this account from the system permanently without option to restore.</div> )
                         }
                         <div className="admin-initials-ctn">
                              <div>Your admin initials (for logging purposes) <span>(Required)</span></div>
                              <input placeholder="MU" onChange={(event)=>setAdminInit(event.target.value)}/>
                              { isValidInitials && (
                                   <div className="warning-ctn">
                                        <img src={init_warning} alt="Warning"/> 
                                        Please enter your admin initials.
                                   </div>
                              )}
                         </div>
                         <button 
                              type="button"
                              className={`${statusCode==0 ? "save-button" : "delete-account-btn"}`}
                              onClick={()=>isInitialValid()}
                         >
                              {statusCode==0 ? "Reactivate Account" : ( 
                                   statusCode==1 ? "Deactivate Account" : 
                                   "Delete Account")}
                         </button>
                    </div>


               </Modal>
          </>
     );

}

export default AdminVolunteerBadgeCard;
