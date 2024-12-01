import "./index.css";
import React, {useEffect, useState} from 'react'
import VolunteerLayout from "../../components/volunteerLayout";
import { getAllClasses } from "../../api/classesPageService";
import Modal from "../../components/Modal";


function ClassPreferences() {
     const [classList, setClassList] = useState(null);
     const [preferenceList, setpreferenceList] = useState([]);
     const [currRank, setCurrRank] = useState(1);
     const [isModalOpen, setIsModalOpen] = useState(false);
     const openModal = () => setIsModalOpen(true);
     const closeModal = () => setIsModalOpen(false);

     useEffect(()=> {
          if (classList == null) {
               (getAllClasses())
               .then((classes) => {
                    setClassList(classes);
               })
               .catch((error) => console.error(error));
          }

     }, [])

     const renderAddRank = ()=> {
          return (
               <button className="preference-box add-rank" onClick={openModal}>
                    <div className="rank-number">{currRank}</div>
                    <div className="preference-box-content">+ Add Rank</div>
               </button>
          );
     };


     const renderClasses = () => {
          return (
               classList.map((element, index) => {
                    if (element == null) return null;
                    else return (
                         <div key={index}>  
                              <button 
                                   onClick={() => {
          
                                   }} 
                              >
                                   {element.class_name}
                              </button>
                              <br />
                         </div>
                    );
               }
          ))
     
     };

     const renderPreference = (element) => {
          return (
               <button className="preference-box" onClick={openModal}>
                    <div className="rank-number">{currRank}</div>
                    <div className="preference-box-content">+ Add Rank</div>
               </button>
          );
     };

     return (
          <VolunteerLayout
               pageTitle="Class Preferences"
               pageContent= {
                    <>
                         <div style={{width: "100%", padding: "0px 30px"}}>
                              <div className="header-text">Winter Session 2024</div>
                              <div className="header-text">Filter:</div>
                              <div className="header-text filter-text">All Categories</div>
                         </div>
                         <hr style={{ borderColor: '#d9d9d9', borderWidth: '0.5px' }} />
                         <div className="page-content">
                              <div style={{width: '100%', fontFamily: "Montserrat", fontWeight: 600, fontSize: '16px', color: '#0F1111',}}>
                                   We will do our best to assign you classes based on your preference. You may add classes to each rank,  or create new ranks to best illustrate your class preference.</div>
                         </div>

                         <div className="my-preferences">
                              <div className="my-preferences-text">My Preferences</div>
                              {renderAddRank()}
                         </div>
                         <div>
                              {isModalOpen && 
                                   <Modal 
                                        closeModal={closeModal} 
                                        modalContent={
                                             <>
                                                  <h2>Class Selection</h2>
                                                  {renderClasses()}
                                             </>
                                        }
                                   />
                              }
                         </div>
                    </>
               }
          ></VolunteerLayout>
     );
};

export default ClassPreferences;