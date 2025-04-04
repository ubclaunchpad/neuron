import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { verifyVolunteer } from "../../api/volunteerService";
import warning_icon from "../../assets/admin-initial-warning.png";
import button_icon_deny from "../../assets/button-icon-deny.png";
import button_icon_verify from "../../assets/button-icon-verify.png";
import confirm_img from "../../assets/confirm-verify-deny.png";
import Modal from "../Modal";
import "./index.css";
import { denyVolunteer } from "../../api/volunteerService";

function UnverifiedUsers({ unverifiedUsers }) {
     const [itemsToRender, setItemsToRender] = useState(unverifiedUsers);
     const [openModal, setOpenModal] = useState(false);
     const [toBeVerified, setToBeVerified] = useState(null);
     const [adminInitial, setAdminInitial] = useState("");
     const [initialValid, setInitialValid] = useState(null);
     const [searchText, setSearchText] = useState("");
     const [isVerifying, setIsVerifying] = useState(null);
     const [isConfirming, setIsConfirming] = useState(false);
     const [modalTitle, setModalTitle] = useState("");
     const navigate = useNavigate();

     const handleOpenModal = () => {
          setOpenModal(true);
     }

     const handleCloseModal = () => {
          setOpenModal(false);
     }

     useEffect(() => {
          if (searchText.length === 0) {
               setItemsToRender(unverifiedUsers);
          }
     }, [searchText]);

     useEffect(() => {
          if (isVerifying == null) return;
          setModalTitle((isVerifying ? "Verifiying" : "Denying") + " " + toBeVerified.f_name + " " + toBeVerified.l_name + "'s account");
     }, [toBeVerified, isVerifying]);

     useEffect(()=> {
          setModalTitle("");
     }, [isConfirming]);

     function renderUnvUserCard(data) {
          return (
               <div className="unv-user-card">
                    <div>
                         <div className="unv-user-card-name">{data.f_name} {data.l_name}</div>
                         <div className="unv-user-card-email">{data.email}</div>
                    </div>
                    <button className="button-verify" onClick={
                         () => {
                                   setIsVerifying(true);
                                   setToBeVerified(data);
                                   handleOpenModal();
                              }
                         }>
                         <img src={button_icon_verify}/>
                         <div>Verify</div>
                    </button>
                    <button className="button-deny" onClick={
                         () => {
                                   setIsVerifying(false);
                                   setToBeVerified(data);
                                   handleOpenModal();
                              }
                         }>
                         <img src={button_icon_deny}/>
                         <div>Deny</div>
                    </button>
               </div>
          );
     }

     function renderModalUserContent() {
          if (!toBeVerified) return null;
          return (
               <>
                    <div className="initial-required-text">
                         <div>
                              Your admin initials (for logging purposes) <span>(Required)</span>
                         </div>
                         <input className="admin-initial-input" placeholder="M.U" onChange={(e) => setAdminInitial(e.target.value)}/>
                         {renderWarning()}
                    </div>
                    {isVerifying ? 
                    <button className="verify-account-btn" onClick={()=>handleVerifyDeny()}>Verify account</button> : 
                    <button className="deny-account-btn" onClick={()=>handleVerifyDeny()}>Deny account</button> }
               </>
          );
     }

     function renderWarning() {
          if (initialValid === null) return null;
          return (<>
               {!initialValid && (<div className="invalid-initial-warning">
                    <img src={warning_icon}/>
                    <div>Please enter your admin initials</div>
               </div>)}
          </>);
     }

     function renderModalContent() {
          if (!isConfirming){
               return (
                    <>
                         {renderModalUserContent()}
                    </>
               );
          } else {
               return (
                    <div className="confirm-content">
                         <img src={confirm_img}/>
                         <div>
                              <h2 className="modal-title">Account {isVerifying ? "verified" : "denied"}</h2>
                              { isVerifying ?
                              <div><strong>{toBeVerified.f_name} {toBeVerified.l_name}</strong> now has access to the platform.</div> :
                              <div>Access to the platform has been denied for <strong>{toBeVerified.f_name} {toBeVerified.l_name}</strong>.</div>
          }
                         </div>
                         <button className="verify-account-btn" onClick={()=>navigate(0)}>OK</button>
                    </div>
               );
          }
     }

     function isInitialValid () {
          const valid = /^[a-zA-Z]\.?[a-zA-Z]\.?$/.test(adminInitial);
          setInitialValid(valid);
          return valid;
     }

     function handleVerifyDeny() {
          if (isInitialValid()) {
               setIsConfirming(true);
               console.log("Logging admin initial...");
               if (isVerifying){
                    verifyVolunteer(toBeVerified.volunteer_id, adminInitial.trim());
               } 
               else {
                    denyVolunteer(toBeVerified.volunteer_id, adminInitial.trim());
                    console.log("Denying volunteer...");
               }
          }
     }

     return (
          <>
               <div className="member-search-bar">
                    <input type="search" placeholder="Search by name or email" className="member-search-input" onChange={(e) => {
                         setSearchText(e.target.value);
                         const txt = e.target.value.trim().toLowerCase();
                         const filteredItems = unverifiedUsers.filter((item) => {
                              return    item.l_name.toLowerCase().includes(txt) ||
                                        item.f_name.toLowerCase().includes(txt) ||
                                        item.email.toLowerCase().includes(txt);
                         })
                         setItemsToRender(filteredItems);
                    }} />
                </div>

               <div className="unv-users-container">
                    {!itemsToRender ? <p>No user to verify</p> : itemsToRender.map(element => {
                         return (<div key={element.email}>
                                   {renderUnvUserCard(element)}
                              </div>);
                    })}
               </div>

               <Modal isOpen={openModal} onClose={handleCloseModal} width={"33vw"} height={"fit-content"} showCloseBtn={!isConfirming} title={modalTitle}>
                    {renderModalContent()}
               </Modal>
          </>
     );
}

export default UnverifiedUsers;