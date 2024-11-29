import "./index.css";
import React, {useEffect, useState} from 'react'
import VolunteerLayout from "../../components/volunteerLayout";
import ClassPanel from "../../components/classPanel";
import { getAllClasses } from '../../api/classesPageService';
import { getShiftInfo } from "../../api/shiftService";

function Classes() {
     const [data, setData] = useState(null);
     const [infoDisplay ,setInfoDisplay] = useState(false);
     const [shiftInfo, setShiftInfo] = useState({});
     // const [classPanelItem, setClassPanelItem] = useState(null);
     const [itemIndex, setItemIndex] = useState(null);
     const [classIdList, setClassIdList] = useState([]);
     const [rerenderKey, setRerenderKey] = useState(0);

     useEffect( () => {
          (getAllClasses())
          .then((data) => {
               setData(data);
               let list = [];
               for (let i = 0; i < data.length; i++) {
                    list.push(data[i].class_id);
               }
               setClassIdList(list);
          })
          .catch((error) => console.error(error));
     }, []);

     const getInfo = () => {
          (getShiftInfo("8eafa250-393b-4918-afdb-d0cfa79b1bdd", "1", "2024-01-01"))
          .then((data) => {
               setShiftInfo(data);
               setInfoDisplay(true);
          })
          .catch((error) => console.error(error));
     }

     return (
          <VolunteerLayout
               pageTitle="Classes"
               pageContent= {
                    <ClassPanel
                         classIdList={classIdList}
                         pageUsed="Classes"
                         itemIndex={itemIndex}
                         pageContent={
                              <div className="classes-page" >
                                   <div>
                                        <div style={{display: 'flex', flexWrap: 'wrap',}}>
                                             {!data ? (
                                                  "Loading Classes..."
                                             ) : (
                                                  data.map((element, index) => (
                                                       <div key={index}>  
                                                            <button 
                                                                 onClick={() => {
                                                                      setItemIndex(index);
                                                                      setRerenderKey(rerenderKey => rerenderKey + 1);
                                                                 }} 
                                                                 className="class-button"
                                                            >
                                                                 {element.class_name}
                                                            </button>
                                                            <br />
                                                       </div>
                                                  ))
                                             )}
                                        </div>
                                        <br/>
                                        <div style={{margin: 5,}}>Test volunteer ID: 8eafa250-393b-4918-afdb-d0cfa79b1bdd</div>
                                        <br/>
                                        <div style={{margin: 5,}}>Test Schedule ID: 1</div>
                                        <br/>
                                        <div style={{margin: 5,}}>Test Shift Date: 2024-01-01</div>
                                        
          
                                        <button onClick={getInfo}>Click for Shift Info</button>
          
                                        {
                                             infoDisplay ? 
                                             <div style={{color: 'green'}}>
                                                  Volunteer: {shiftInfo.volunteer_f_name + " " + shiftInfo.volunteer_l_name}   <br/>
                                                  Instructor: {shiftInfo.instructor_f_name + " " + shiftInfo.instructor_l_name}  <br/> 
                                                  Class Name: {shiftInfo.class_name} <br/> 
                                                  Start Time: {shiftInfo.start_time} <br/> 
                                                  End Time: {shiftInfo.end_time} <br/> 
                                                  Shift Duration: {shiftInfo.duration} <br/>
                                                  </div> : null
                                        }
                                        <br/>
                                   </div>
          
                              </div>
                         }  
                         rerenderKey={rerenderKey}  
                    ></ClassPanel>
               }
          ></VolunteerLayout>
     );
};

export default Classes;