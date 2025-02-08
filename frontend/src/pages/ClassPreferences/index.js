import "./index.css";
import React, {useEffect, useState} from 'react';
import edit_icon from "../../assets/edit-icon.png";
import filter_icon from "../../assets/filter-icon.png";
import search_icon from "../../assets/search-icon.png";


import { fetchUserPreferredClasses, updateUserPreferredClasses} from "../../api/volunteerService";
import { getAllClasses, getAllClassSchedules, getClassById} from "../../api/classesPageService";
import ClassPreferencesCard from "../../components/ClassPreferencesCard";
import Modal from "../../components/Modal";
import Checkbox from "../../components/Checkbox";

function ClassPreferences() {
     // Class Preferences page hooks
     const [volunteerId, setVolunteerId] = useState(null);
     const [preferredClasses, setPreferredClasses] = useState({1: [], 2: [], 3: []});
     const [allClasses, setAllClasses] = useState(null);

     // Modal hooks
     const [modalOpen, setModalOpen] = useState(false);
     const [modalTitle, setModalTitle] = useState("");
     const [chosenRank, setChosenRank] = useState(0);
     const [chosenNumClasses, setChosenNumClasses] = useState(null);
     const [numFilters, setNumFilters] = useState(0);
     const [confirmModalOpen, setConfirmModalOpen] = useState(false);
     const [alertModalOpen, setAlertModalOpen] = useState(false);

     
     const openModal = () => {
          setModalOpen(true);
     };
     const closeModal = () => {
          setConfirmModalOpen(false);
          if (modalOpen) setModalOpen(false);
          else getCurrentUserPrefferedClasses();
          setChosenRank(0);
     };

     const timeDifference = (end, start) => {
          if (end === null || end === undefined || end ==="" || start === null || start === undefined || start === "") return "";

          // Assume classes are done within one day, end time > start time 
          const e = end.split(":");
          const s = start.split(":");
          if (e[1] < s[1]) {
              return `${Number(e[0]) - 1 - Number(s[0])} hr ${-(Number(e[1]) - Number(s[1]))} min`;
          } else if (e[1] > s[1]) {
              return `${Number(e[0]) - Number(s[0])} hr ${(Number(e[1]) - Number(s[1]))} min`;
          } else {
              return `${Number(e[0]) - Number(s[0])} hr`;
          }
     };
  
     const formatTime = (time) => {
          if (time === null || time === undefined || time === "") return "";
          const [hour, minute] = time.split(":").map(Number);
          const period = hour >= 12 ? "PM" : "AM";
          const formattedHour = hour % 12 || 12;
          return `${formattedHour}:${minute.toString().padStart(2, "0")} ${period}`;
     };

     useEffect(()=> {
          setModalTitle(rankName(chosenRank) + " (" + chosenNumClasses + ")");
     }, [chosenNumClasses, chosenRank])

     const getCurrentUserPrefferedClasses = async () => {
          const volunteerID = localStorage.getItem('volunteerID');
          setVolunteerId(volunteerID);

          const classes_p = await fetchUserPreferredClasses(volunteerID);
          let res = {};
          if (classes_p !== null && classes_p.length > 0) {
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
          if (allClasses == null) {
               const [classData, classSchedules] = await Promise.all([getAllClasses(), getAllClassSchedules()]);

               const classMap = new Map();
               for (let i = 0; i < classData.length; i++) {
                    classMap.set(classData[i].class_id, classData[i]);
               }

               for (let i = 0; i <  classSchedules.length; i++) {
                    if (classMap.get(classSchedules[i].fk_class_id)["start_times"] === undefined) {
                         classMap.get(classSchedules[i].fk_class_id)["start_times"] = (classSchedules[i].start_time);
                         classMap.get(classSchedules[i].fk_class_id)["end_times"] = (classSchedules[i].end_time);
                         classMap.get(classSchedules[i].fk_class_id)["duration"] = timeDifference(classSchedules[i].end_time, classSchedules[i].start_time);
                    }
               }

               let classData_ = [];
               classMap.forEach((value, key) => {
                    if (value["start_times"] === undefined) {
                         value["start_times"] = "";
                         value["end_times"] = "";
                         value["duration"] = "";
                    }
                    classData_.push(value);
               });
               
               let res = classData_.reduce((map, obj) => {
                    if (!map.has(obj.category)) {
                      map.set(obj.category, []);
                    }
                    map.get(obj.category).push(obj);
                    return map;
               }, new Map());
               setAllClasses(res);
          }
     }; 

     useEffect(() => {
          getCurrentUserPrefferedClasses();
     }, [allClasses]);

     function rankName(rank) {
          if (rank === 1) return "Most Preferred";
          else if (rank === 2) return "More Preferred";
          else return "Preferred";
     }


     function renderClasses (rank) {
          if (preferredClasses == null || preferredClasses[rank].length === 0) {
            return <>You have not chosen class preferences...</>;
          }
          return (
               <>
                    {preferredClasses[rank].map((class_, index) => (
                              <ClassPreferencesCard classData={class_} fullWith={false}></ClassPreferencesCard>
                    ))}
               </>
          );
     };

     async function handleEditClass(rank) {
          setChosenRank(rank);
          if (preferredClasses[rank] !== undefined){
               setChosenNumClasses(preferredClasses[rank].length);
          }
          else setChosenNumClasses(0);
          openModal();
     }

     function renderTitle() {
          return (<h2 className="modal-title">{modalTitle}</h2>);
     }

     function renderSearchBar() {
          return (
               <>
                    <div className="search-bar-container">
                         <div className="search-bar">
                              <button className="search-button">
                                   <img src={search_icon} alt="Search Icon"/>
                              </button>
                              <input placeholder="Search by class name or instructor"></input>
                         </div>
                         <button className="filter-button">
                              <img src={filter_icon} alt="Filter icon"/>
                         </button>
                    </div>

                    <div className="modal-info-bar">
                         <div>Selected ({chosenNumClasses})</div>
                         <div>Clear Filters ({numFilters})</div>
                    </div>
               </> 
          );
     }

     function renderClassCategory(cat) {
          return (<div className="class-cat">{cat}</div>);
     }

     const handleCheckboxClicked = async (class_) => {
          for (let i = 0; i < preferredClasses[chosenRank].length; i++) {
               if (preferredClasses[chosenRank][i].class_id === class_.class_id) {
                    preferredClasses[chosenRank].splice(i, 1);
                    setChosenNumClasses(preferredClasses[chosenRank].length);
                    return;
               }
          }
          const classDataById = await getClassById(class_.class_id);
          classDataById.class_rank = chosenRank;
          preferredClasses[chosenRank].push(classDataById);
          setChosenNumClasses(preferredClasses[chosenRank].length);
     }

     function ifClassIsPreferred(class_) {
          for (let i = 0; i < preferredClasses[chosenRank].length; i ++) {
               if (class_.class_id === preferredClasses[chosenRank][i].class_id) return true;
          }
          return false;
     }

     function renderClassesInCat(classes) {
          return (
               <>
                    {classes.map((class_, index) => (
                         <div className="class-container">
                              <div className="class-container-col1">
                                   <Checkbox onClicked={()=>{handleCheckboxClicked(class_)}} active={ifClassIsPreferred(class_)}/>
                              </div>
                              <div className="class-container-col2">
                                   <h2>{formatTime(class_.start_times)}</h2>
                                   <h3>{class_.duration}</h3>
                              </div>
                              <div className="class-container-col3">
                                   <div className="class-container-col3-name">{class_.class_name}</div>
                                   <div className="class-container-col3-instr">{class_.instructions}</div>
                              </div>
                         </div>
                    ))}
               </>
          );
     }

     function renderSearchClasses() {
          return (
               <>
                    {[...allClasses.entries()].map(([key, value]) => (
                         <>
                              <div key={key}>{renderClassCategory(key)}</div> 
                              <div>
                                   {renderClassesInCat(value)}
                              </div>
                         </>
                    ))}
               </>
          );
     }

     function handleOK () {
          closeModal();
     }

     function renderModal(rank) {
          if (rank === 0) return null;

          return (
               <>
                    {renderTitle()}       
                    {renderSearchBar()}  
                    <div className="seach-classes-container">
                         {renderSearchClasses()}
                    </div>
                    <div>
                         <button className="save-button modal-save-button" onClick={()=>handleOK()}>OK</button>
                    </div>
               </> 
          );
     }

     const handleConfirm = () => {
          setConfirmModalOpen(true);
     }

     const handleCancel = () => {
          setConfirmModalOpen(true);
     }

     const handleSave = async() => {
          let res = [];
          for (let j = 1; j < 4; j++) {
               for (let i = 0; i < preferredClasses[j].length; i++) {
                    res.push({class_id: preferredClasses[j][i].class_id, class_rank: preferredClasses[j][i].class_rank});
               }
          }
          const result = await updateUserPreferredClasses(volunteerId, res);

          setAlertModalOpen(true);
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
                         <button className="cancel-button middle-button" onClick={handleCancel}>Cancel</button>
                         <button className="save-button left-button" onClick={handleSave}>Save</button>
                    </div>
                    <div className="rank-container">
                         <div className="rank-header">
                              <div>
                                   <div className="rank-name">
                                        {rankName(1)}
                                   </div>
                                   <button type="button" className="edit-rank-button" onClick={()=> handleEditClass(1)}>
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
                                        {rankName(2)}
                                   </div>
                                   <button type="button" className="edit-rank-button" onClick={() => handleEditClass(2)}>
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
                                        {rankName(3)}
                                   </div>
                                   <button type="button" className="edit-rank-button" onClick={ () => handleEditClass(3)}>
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
               <Modal isOpen={modalOpen} onClose={handleConfirm} width={"600px"} height={"90%"}>
                    {renderModal(chosenRank)}
               </Modal>

               <Modal isOpen={confirmModalOpen} onClose={()=> setConfirmModalOpen(false)} width={"fit-content"} height={"fit-content"}>
                    <div className="confirm-modal-container">
                    Your Progress will be lost. Are you sure? 
                    <div >
                         <button className="save-button" onClick={()=> closeModal()}>Yes</button>
                         <button className="cancel-button" onClick={()=> setConfirmModalOpen(false)}>No</button>
                    </div>
                    </div>
               </Modal>

               <Modal isOpen={alertModalOpen} width={"fit-content"} height={"fit-content"}>
                    <div className="alert-modal-content">Your preferences have been recorded!
                         <button className="save-button" onClick={()=> {window.location.reload(true)}}>Close</button>
                    </div>
               </Modal>
               </main>
               
     );
};

export default ClassPreferences;