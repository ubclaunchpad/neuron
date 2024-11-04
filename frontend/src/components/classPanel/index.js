import "./index.css";
import React, {useEffect, useState} from 'react';
import button_icon_close from "../../assets/images/button-icons/button-icon-close.png";
import button_icon_prev from "../../assets/images/button-icons/button-icon-prev.png";
import button_icon_next from "../../assets/images/button-icons/button-icon-next.png";
import { getClassById } from '../../api/classesPageService';




function ClassPanel({classIdList, itemIndex, pageUsed, pageContent, rerenderKey}) {
     const [panelWidth, setPanelWidth] = useState("0px");
     const [panelInfo, setPanelInfo] = useState(null);
     const [daysOfWeek, setDayOfWeek] = useState(["Not Scheduled"]);
     const [startTimes, setStartTimes] = useState(["Not Scheduled"]);
     const [endTimes, setEndTimes] = useState(["Not Scheduled"]);
     const [instructions, setInstructions] = useState("No instructions");
     const [instructor, setInstructor] = useState("No instructor available");
     const [volunteers, setVolunteers] = useState(["No volunteer for this class"]);
     const [currIdx, setCurrIdx] = useState(itemIndex);

     
     useEffect(() => {
          setCurrIdx(itemIndex);
          if (itemIndex !== null) {
               getClassById(classIdList[itemIndex])
               .then((data) => {
                    setPanelInfo(data);
               })
               .catch((error) => console.error(error));
          }
      }, [classIdList, itemIndex, rerenderKey]);

     useEffect(()=> {
          const dow = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
          if (panelInfo) {
               setPanelWidth("35vw");
               if (pageUsed==="Classes") {
                    if (panelInfo.days_of_week){
                         setDayOfWeek(panelInfo.days_of_week.split(',').map(number => dow[number - 1])[0]);
                    } else setDayOfWeek(["Not Scheduled"]);

                    if (panelInfo.start_times) {
                         setStartTimes(panelInfo.start_times.split(',').map(time => formatTime(time))[0]);
                    } else setStartTimes(["Not Scheduled"]);

                    if (panelInfo.end_times){
                         setEndTimes(panelInfo.end_times.split(',').map(time => formatTime(time))[0]);
                    } else setEndTimes(["Not Scheduled"]);

                    if (panelInfo.instructions){
                         setInstructions(panelInfo.instructions);
                    } else setInstructions("No instructor available");
                    
                    if (panelInfo.instructor_l_name && panelInfo.instructor_f_name){
                         setInstructor(panelInfo.instructor_f_name + " " + panelInfo.instructor_l_name);
                    } else setInstructor("No instructor available");

                    if (panelInfo.volunteer_l_names && panelInfo.volunteer_f_names) {
                         const l_names = panelInfo.volunteer_l_names.split(',');
                         const f_names = panelInfo.volunteer_f_names.split(',');
                         let volunteers = [];
                         for (let i = 0; i < l_names.length; i++) {
                              const name = f_names[i] + " " + l_names[i];
                              volunteers.push(name);
                         }
                         setVolunteers(volunteers);
                    } else {
                         setVolunteers(["No volunteer for this class"]);
                    }
               }
          } else { 
               setPanelWidth("0px");
          }

     }, [panelInfo, pageUsed]);

     
     const formatTime = (time) => {
          const times = time.split(":");
          let hour = times[0];
          const minute = times[1];
          let ampm;
          if (+hour === 0) {
               ampm = "AM";
               hour = "12";
          } else if (+hour < 12) {
               ampm = "AM";
          } else if (+hour === 12) {
               ampm = "PM";
          } else {
               ampm = "PM";
               hour = "0" + (+hour - 12);
          }
          return hour + ":" + minute + " " + ampm;
     };

     const renderStatus = () => {
          return (
               <div className="status">My Shift</div>
          );
     }

     const renderVolunteers = () => {
          if (volunteers.length === 1  && volunteers[0] === "No volunteer for this class") {
               return (
                    <>{volunteers[0]}</>
               );
          } else {
               return (
                    <div style={{display: 'flex', flexDirection: 'column', gap: "8px"}}>
                         {volunteers.map(vol => {
                              return (
                                   <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center'}} key={vol}>
                                        <div className="volunteer-profile"></div>
                                        <div>{vol}</div>
                                   </div>
                              );
                         })}
                    </div>
               );
          }
     }

     const handleClosePanel = () => {
          setPanelWidth("0px");
     };

     function getInfo(idx) {
          getClassById(classIdList[idx])
          .then((data) => {
               setPanelInfo(data);
          })
          .catch((error) => console.error(error));
     }

     const handleToPrev = () => {
          const prevIdx = currIdx - 1;
          if (prevIdx !== null && prevIdx >= 0 && prevIdx < classIdList.length) {
               setCurrIdx(prevIdx);
               getInfo(prevIdx);
          }
     };

     const handleToNext = () => {
          const nextIdx = currIdx + 1;
          if (nextIdx !== null && nextIdx >= 0 && nextIdx < classIdList.length) {
               setCurrIdx(nextIdx);
               getInfo(nextIdx);
          }
     };

     return (
          <>
          <div className="main-container" style={{width: 'calc(100% - ' + panelWidth +')'}}>
               {pageContent}
          </div>
          <div className="panel-container" style={{width: panelWidth}}>
               <div className="panel-header">
                    <div className="panel-header-dow panel-titles">{daysOfWeek}</div>
                    <div className="panel-titles panel-header-time">{startTimes + " - " + endTimes}</div>
                    <div className="panel-header-class-name">{panelInfo?.class_name? panelInfo.class_name : "N/A"}</div>
                    <button className="panel-button-icon panel-button-icon-close" onClick={handleClosePanel}>
                         <img alt="" style={{width: 16, height: 16}} src={button_icon_close}/>
                    </button>
               </div>
               <div className="panel-details">
                    <div className="panel-details-shift">
                         <div className="panel-details-shift-row">
                              <div className="panel-titles">Status</div>
                              <div className="panel-details-shift-right"> 
                                   {renderStatus()}
                              </div>
                         </div>

                         <div className="panel-details-shift-row">
                              <div className="panel-titles">Instructor</div>
                              <div className="panel-details-shift-right"> 
                                   {instructor}
                              </div>
                         </div>

                         <div className="panel-details-shift-row" style={{alignItems: 'normal'}}>
                              <div className="panel-titles">Volunteers</div>
                              <div className="panel-details-shift-right"> 
                                   {renderVolunteers()}
                              </div>
                         </div>

                    </div>
                    <div className="panel-details-description">
                         <div className="panel-titles">Description</div>
                         <div className="panel-description">
                              {instructions}
                         </div>
                    </div>
               </div>
               <div className="button-icons">
                    <button className="panel-button-icon" onClick={handleToPrev}>
                         <img alt="" src={button_icon_prev} style={{width: 16, height: 16}}/>
                    </button>
                    <button className="panel-button-icon" onClick={handleToNext}>
                         <img alt="" src={button_icon_next} style={{width: 16, height: 16}}/>
                    </button>    
               </div>
          </div>
          </>
     );
}



export default ClassPanel;