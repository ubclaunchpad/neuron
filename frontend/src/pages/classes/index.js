import "./index.css";
import React, {useEffect, useState} from 'react'
import Header from '../../components/header';
import { getAllClasses, getShiftInfo } from '../../api/classesPageService';

function Classes() {
     const [data, setData] = useState(null);
     const [infoDisplay ,setInfoDisplay] = useState(false);
     const [shiftInfo, setShiftInfo] = useState({});

     useEffect( () => {
          (getAllClasses())
          .then((data) => setData(data))
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
          <div className="classes-page">
               <Header />
               {!data ? "Loading Classes..." : 
                    data.map((element) => (
                         <h1 key={element.class_id}> {element.class_name}</h1>
                    ))
               }
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
     );
};

export default Classes;