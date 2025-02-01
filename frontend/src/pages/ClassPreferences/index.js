import "./index.css";
import React, {useEffect, useState} from 'react';
import edit_icon from "../../assets/edit-icon.png"
import { fetchUserPreferredClasses } from "../../api/volunteerService";
import ClassPreferencesCard from "../../components/ClassPreferencesCard";

function ClassPreferences() {
     const [preferredClasses, setPreferredClasses] = useState(null);
     const [allClasses, setAllClasses] = useState(null);

     useEffect(() => {
          const getCurrentUserPrefferedClasses = async () => {
              const volunteerID = localStorage.getItem('volunteerID');

          //     setUserId(user_id);
              const classes_p = await fetchUserPreferredClasses(volunteerID);
              if (classes_p!=null && classes_p.length > 0) {
                    let res = {};
                    let rank1 = [];
                    let rank2 = [];
                    let rank3 = [];
                    for (let i = 0; i < classes_p.length; i++) {
                         if (classes_p[i].class_rank === 1) {
                              rank1.push(classes_p[i]);
                         } else if (classes_p[i].class_rank === 2) {
                              rank2.push(classes_p[i]);
                         } else {
                              rank3.push(classes_p[i]);
                         }
                    }
                    res[1] = rank1;
                    res[2] = rank2;
                    res[3] = rank3;
                    setPreferredClasses(res);
               }
          }; 
          getCurrentUserPrefferedClasses();
          
     }, []);

     useEffect(()=> {
          console.log(preferredClasses);
     }, [preferredClasses]);

     function renderClasses (rank) {
          if (preferredClasses == null || preferredClasses[rank].length == 0) {
            return <>You have not chosen class preferences...</>;
          }
     
          return (
               <>
                    {preferredClasses[rank].map((class_, index) => (
                              <ClassPreferencesCard classData={class_}></ClassPreferencesCard>
                    ))}
               </>
          );
     };



     return (
          <main className="content-container">
               <div className="content-heading">
                    <h2 className="content-title">Class Preferences</h2>
                    <button className="logout-button" onClick={() => {
                         localStorage.removeItem("neuronAuthToken");
                         window.location.href = "/auth/login";
                    }}>
                    <i className="fa-solid fa-arrow-right-from-bracket"></i>&nbsp;&nbsp;Log Out
                    </button>
               </div>
               <div className="parent-container">
                    <div className="parent-container-header">
                         <div className="parent-container-title">My Preferences</div>
                         <button className="cancel-button middle-button">Cancel</button>
                         <button className="save-button left-button">Save</button>
                    </div>
                    <div className="rank-container">
                         <div className="rank-header">
                              <div>
                                   <div className="rank-name">
                                   Most Preferred 
                                   </div>
                                   <button type="button" className="edit-rank-button">
                                        <img src={edit_icon} alt="Edit Classes" height={20}/>{"  "}
                                        <div>Edit Classes</div>
                                   </button>
                              </div>

                         </div>
                         <div className="class-preferences-card-container">
                              {renderClasses(1)}
                         </div>
                    </div>

                    <div className="rank-container">
                         <div className="rank-header">
                              <div>
                                   <div className="rank-name">
                                   More Preferred 
                                   </div>
                                   <button type="button" className="edit-rank-button">
                                        <img src={edit_icon} alt="Edit Classes" height={20}/>{"  "}
                                        <div>Edit Classes</div>
                                   </button>
                              </div>
                         </div>
                         <div className="class-preferences-card-container">
                              {renderClasses(2)}
                         </div>
                    </div>

                    <div className="rank-container">
                         <div className="rank-header">
                              <div>
                                   <div className="rank-name">
                                   Preferred 
                                   </div>
                                   <button type="button" className="edit-rank-button">
                                        <img src={edit_icon} alt="Edit Classes" height={20}/>{"  "}
                                        <div>Edit Classes</div>
                                   </button>
                              </div>
                         </div>
                         <div className="class-preferences-card-container">
                              {renderClasses(3)}
                         </div>
                    </div>

               </div>
               </main>
     );
};

export default ClassPreferences;