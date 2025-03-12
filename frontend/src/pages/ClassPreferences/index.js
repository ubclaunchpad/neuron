import "./index.css";
import React, {useEffect, useState, useRef} from 'react';
import edit_icon from "../../assets/edit-icon.png";
import filter_icon from "../../assets/filter-icon.png";
import search_icon from "../../assets/search-icon.png";
import { useAuth } from "../../contexts/authContext";
import { fetchUserPreferredClasses, fetchAllClassPreferences, updateUserPreferredClasses, fetchVolunteerAvailability} from "../../api/volunteerService";
import ClassPreferencesCard from "../../components/ClassPreferencesCard";
import Modal from "../../components/Modal";
import Checkbox from "../../components/Checkbox";

function ifFitAvailability(class_, availability) {
     return compareTime(availability.start_time, class_.start_time) && compareTime(class_.end_time, availability.end_time);
}

function compareTime (time1, time2) {
     const t1 = time1.split(":");
     const t2 = time2.split(":");
     if (Number(t1[0]) < Number(t2[0])) return true;
     else if (Number(t1[0]) === Number(t2[0]) && Number(t1[1]) <= Number(t2[1])) {
     return true;
     } else return false;
}

function ClassPreferences() {
     // Class Preferences page hooks
     const [volunteerId, setVolunteerId] = useState(null);
     const [preferredClasses, setPreferredClasses] = useState({1: [], 2: [], 3: []});
     const [allClasses, setAllClasses] = useState(null);
     const { user } = useAuth();
     const [userAvailability, setUserAvailability] = useState(null);
     const FIT_AVAILABILITY_TITLE = "Classes that Fit My Availability";

     // Modal hooks
     const [modalOpen, setModalOpen] = useState(false);
     const [modalTitle, setModalTitle] = useState("");
     const [chosenRank, setChosenRank] = useState(0);
     const [chosenNumClasses, setChosenNumClasses] = useState(null);
     const [numFilters, setNumFilters] = useState(0);
     const [confirmModalOpen, setConfirmModalOpen] = useState(false);
     const [alertModalOpen, setAlertModalOpen] = useState(false);
     const [displayClassPref, setDisplayClassPref] = useState(null);
     const [searchText, setSearchText] = useState("");
     const [showFilterPanel, setShowFilterPanel] = useState(false);
     const filterPanelRef = useRef(null);
     const filterButtonRef = useRef(null);
     const [filterSet, setFilterSet] = useState(new Set());
     const [ifFitAvailabilityShow, setIfFitAvailabilityShow] = useState(false);
     const [fitAvailabilityClasses, setFitAvailabilityClasses] = useState(null);

     const openModal = () => {
          setModalOpen(true);
     };

     const closeModal = (ifSave) => {
          setConfirmModalOpen(false);
          if (modalOpen) setModalOpen(false);
          else getCurrentUserPrefferedClasses();
          setChosenRank(0);
          resetFilter();
          if (!ifSave) getCurrentUserPrefferedClasses();
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
     }, [chosenNumClasses, chosenRank]);

     useEffect(()=> {
          setIfFitAvailabilityShow(filterSet.has(FIT_AVAILABILITY_TITLE));
     }, [filterSet]);

     useEffect(()=> {
          if (numFilters === 0) {
               setDisplayClassPref(allClasses);
          } else {
               if (filterSet.has(FIT_AVAILABILITY_TITLE)) return;
               let tempMap = new Map();
               for (let [cat, classes] of allClasses.entries()) {
                    if (filterSet.has(cat)) tempMap.set(cat, classes);
               }
               setDisplayClassPref(new Map(tempMap));
          }
     }, [numFilters]);

     useEffect(() => {
          if (fitAvailabilityClasses || !allClasses || !userAvailability) return;
          let tempMap = new Map();
          for (let [cat, classes] of allClasses.entries()) {
               tempMap.set(cat, []);
               for (let i = 0; i < classes.length; i++) {
                    for ( let j = 0; j < userAvailability.get(classes[i].day).length; j++ ) {
                         if (ifFitAvailability(classes[i], userAvailability.get(classes[i].day)[j])) tempMap.get(cat).push(classes[i]);
                    }
               }
          }
          setFitAvailabilityClasses(new Map(tempMap));
     }, [allClasses, userAvailability, fitAvailabilityClasses]);

     const getCurrentUserPrefferedClasses = async () => {
          const volunteerID = user.volunteer.volunteer_id;
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
          if (allClasses === null) {
               const allClassPreferences = await fetchAllClassPreferences();
               const classMap = new Map();
               allClassPreferences.forEach(element => {
                    const key = element.category ? element.category : "(Uncategorized Classes)";
                    if (!classMap.has(key)) {
                         classMap.set(key, [element]);
                    } else {
                         classMap.get(key).push(element);
                    }
               });
               setAllClasses(classMap);
               setDisplayClassPref(classMap);
          }

          const availability = await fetchVolunteerAvailability(volunteerID);
          let availabilityMap = new Map([[0, []], [1, []], [2, []], [3, []], [4, []], [5, []], [6, []]]);
          availability.sort((a, b) => {return compareTime(b.start_time, a.start_time) ? 1 : -1});
          
          for (let i = 0; i < availability.length; i++) {
               const day = availability[i].day;
               if (availabilityMap.get(day).length === 0) availabilityMap.get(day).push(availability[i]);
               else {
                    if (availabilityMap.get(day)[availabilityMap.get(day).length-1].end_time === availability[i].start_time) {
                         availabilityMap.get(day)[availabilityMap.get(day).length-1].end_time = availability[i].end_time;
                    } else {
                         availabilityMap.get(day).push(availability[i]);
                    }
               }
          }
          setUserAvailability(availabilityMap);
     }; 

     function ifMatch(class_) {
          if   (class_.class_name.toLowerCase().includes(searchText.toLowerCase().trim()) ||
               class_.f_name.toLowerCase().includes(searchText.toLowerCase().trim()) ||
               class_.l_name.toLowerCase().includes(searchText.toLowerCase().trim()) 
          ) return true;
          return false;
     }

     const onSearch = () => {
          if (searchText.length === 0) return;
          let tempMap = new Map();
          for (let [cat, classes] of allClasses.entries()) {
               tempMap.set(cat, []);
               for (let i = 0; i < classes.length; i++) {
                    if (ifMatch(classes[i])) {
                         tempMap.get(cat).push(classes[i]);
                    }
               }
          }
          setDisplayClassPref(tempMap);   
     };

     const onClassesAvailabity = () => {
          const tempSet = new Set();
          if (filterSet.has(FIT_AVAILABILITY_TITLE)) {
               tempSet.delete(FIT_AVAILABILITY_TITLE);
               setNumFilters(0);
               setFilterSet(tempSet);
               return;
          }
          tempSet.add(FIT_AVAILABILITY_TITLE);
          setNumFilters(1);
          setFilterSet(tempSet);
          setDisplayClassPref(fitAvailabilityClasses);   
     };

     const resetFilter = ()=> {
          setNumFilters(0);
          setFilterSet(new Set());
          setDisplayClassPref(allClasses);
          setSearchText("");
     };

     useEffect(() => {
          getCurrentUserPrefferedClasses();
     }, []);

     useEffect(() => {
          const handleClickOutside = (event) => {
               if ((filterPanelRef.current && !filterPanelRef.current.contains(event.target)) && (filterButtonRef.current && !filterButtonRef.current.contains(event.target))) {
                    setShowFilterPanel(false);
               }
          };
      
          document.addEventListener("mousedown", handleClickOutside);
          return () => {
               document.removeEventListener("mousedown", handleClickOutside);
          };
     }, []);

     function rankName(rank) {
          if (rank === 1) return "Most Preferred";
          else if (rank === 2) return "More Preferred";
          else return "Preferred";
     }


     function renderClasses(rank) {
          if (preferredClasses === null || preferredClasses[rank].length === 0) {
            return <>You have not chosen class preferences...</>;
          }
          return (
               <>
                    {preferredClasses[rank].map((class_, index) => (
                         <ClassPreferencesCard classData={class_} fullWith={false} key={index}></ClassPreferencesCard>
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


     function renderFilterItem(title) {
          return (
               <div className="filter-item" >
                    <Checkbox onClicked={()=> {
                         let tempSet = new Set(filterSet);
                         
                         if (filterSet.has(FIT_AVAILABILITY_TITLE)) {
                              tempSet.delete(FIT_AVAILABILITY_TITLE);
                         }

                         if (tempSet.has(title)) {
                              tempSet.delete(title);
                              setNumFilters(Math.max(0, numFilters-1));
                         } else {
                              tempSet.add(title);
                              setNumFilters(numFilters+1);
                         }
                         setFilterSet(tempSet);
                    }} active={filterSet.has(title)}/> {title}
               </div>
          );
     }

     function renderFilterPanel() {
          return <> 
               <div className="filter-item">
                    <Checkbox onClicked={onClassesAvailabity} active={ifFitAvailabilityShow}/> {FIT_AVAILABILITY_TITLE}
               </div>
               {([...allClasses.keys()].map((key) => {
                    return (<div key={key}> {renderFilterItem(key)} </div>)
               }))}
          </>
     }

     function renderSearchBar() {
          return (
               <>
                    <div className="search-bar-container">
                         <div className="search-bar">
                              <button className="search-button" onClick={onSearch}>
                                   <img src={search_icon} alt="Search Icon"/>
                              </button>
                              <input 
                                   placeholder="Search by class name or instructor"
                                   type="text"
                                   value={searchText}
                                   onChange={(e) => setSearchText(e.target.value)} 
                              />
                         </div>
                         <button ref={filterButtonRef} className="filter-button" onClick={()=> {setShowFilterPanel(!showFilterPanel)}}>
                              <img src={filter_icon} alt="Filter icon"/>
                         </button>
                         {showFilterPanel && (
                              <div className="filter-panel" ref={filterPanelRef}>
                                   {renderFilterPanel()}
                              </div>
                         )}
                    </div>

                    <div className="modal-info-bar">
                         <div>Selected ({chosenNumClasses})</div>
                         <button onClick={resetFilter}>Clear Filters ({numFilters})</button>
                    </div>
               </> 
          );
     }

     function renderClassCategory(cat) {
          return (<div className="class-cat">{cat}</div>);
     }

     const handleCheckboxClicked = async (class_) => {
          const tempSet = new Set(filterSet)
          tempSet.delete(FIT_AVAILABILITY_TITLE);
          setFilterSet(tempSet);
          for (let i = 0; i < preferredClasses[chosenRank].length; i++) {
               if (preferredClasses[chosenRank][i].schedule_id === class_.schedule_id) {
                    preferredClasses[chosenRank].splice(i, 1);
                    setChosenNumClasses(preferredClasses[chosenRank].length);
                    return;
               }
          }
          class_.class_rank = chosenRank;
          preferredClasses[chosenRank].push(class_);
          setChosenNumClasses(preferredClasses[chosenRank].length);
     }

     function ifClassIsPreferred(class_) {
          for (let i = 0; i < preferredClasses[chosenRank].length; i ++) {
               if (class_.schedule_id === preferredClasses[chosenRank][i].schedule_id) return true;
          }
          return false;
     }

     function renderClassesInCat(classes) {
          return (
               <>
                    {classes.map((class_, index) => (
                         <div className="class-container" key={index}>
                              <div className="class-container-col1">
                                   <Checkbox onClicked={()=>{handleCheckboxClicked(class_)}} active={ifClassIsPreferred(class_)}/>
                              </div>
                              <div className="class-container-col2">
                                   <h2>{formatTime(class_.start_time)}</h2>
                                   <h3>{timeDifference(class_.end_time, class_.start_time)}</h3>
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

     const renderSearchClasses = () => {
          if (!displayClassPref) return null;
          return (
               <>
                    {[...displayClassPref.entries()].map(([key, value]) => (
                         (value && (Array.isArray(value) ? value.length > 0 : true)) ? (
                         <div key={key}>
                              <div>{renderClassCategory(key)}</div>
                              <div>{renderClassesInCat(value)}</div>
                         </div>
                         ) : null
                    ))}
               </>
          );
     }
        

     function handleOK () {
          closeModal(true);
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
                    res.push({schedule_id: preferredClasses[j][i].schedule_id, class_rank: preferredClasses[j][i].class_rank});
               }
          }
          await updateUserPreferredClasses(volunteerId, res);

          setAlertModalOpen(true);
     };

     return (
          <main className="content-container">
               <div className="content-heading">
                    <h2 className="content-title">Class - Schedule Preferences</h2>
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
                         <button className="save-button" onClick={()=> closeModal(false)}>Yes</button>
                         <button className="cancel-button" onClick={()=> setConfirmModalOpen(false)}>No</button>
                    </div>
                    </div>
               </Modal>

               <Modal isOpen={alertModalOpen} width={"fit-content"} height={"fit-content"} onClose={() => {window.location.reload(true)}}>
                    <div className="alert-modal-content">Your preferences have been recorded!
                         <button className="save-button" onClick={()=> {window.location.reload(true)}}>Close</button>
                    </div>
               </Modal>
          </main>
               
     );
};

export default ClassPreferences;