import "./index.css";
import React, {useEffect, useState} from 'react';
import VolunteerLayout from "../../components/volunteerLayout";
import edit_icon from "../../assets/edit-icon.png"

function ClassPreferences() {
     return (
          <VolunteerLayout
               pageTitle={"Class Preferences"}
               pageStyle={{
                    overflowY: "auto"
               }}
          >
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
                    </div>

               </div>
          </VolunteerLayout>
     );
};

export default ClassPreferences;