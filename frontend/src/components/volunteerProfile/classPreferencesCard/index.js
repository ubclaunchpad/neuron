import "./index.css";
import React, {useEffect, useState} from "react";
import edit_icon from "../../../assets/edit-icon.png"
import { fetchUserPreferredClasses } from "../../../api/volunteerService";
import ClassPreferencesCard from "../../ClassPreferencesCard";
import { NavLink } from "react-router-dom";
import empty_img from "../../../assets/no-class-preferences.png";
import plus from "../../../assets/plus.jpg";

function ClassPreferencesCardMP({volunteer}) {

    const [preferredClasses, setPreferredClasses] = useState(null);

    useEffect(() => {
        const getCurrentUserPrefferedClasses = async () => {
            const volunteerID = volunteer.volunteer_id;

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

    function renderClassRank(rank, item) {
        let rankTitle;
        if (rank === 1) rankTitle = "Most Preferred";
        else if (rank === 2) rankTitle = "More Preferred";
        else rankTitle = "Preferred";

        return <>
            <h3 className="rank-title">{rankTitle}</h3>
            <>
                {item.length===0 ? <p style={{textAlign: "center"}}>No preferences</p> : item.map((class_, index) => (
                            <ClassPreferencesCard classData={class_} fullWith={true}/>
                ))}
            </>
        </>;
    }

    function renderEmpty() {
        return (<>
            <div class="no-class-preferences-container">
                <img className="no-class-preferences-img" src={empty_img} alt="No Preferred Classes"></img>
                <p>Not specified yet.</p>
                <NavLink className="cancel-button edit-rank-button edit-button-empty" to="/volunteer/class-preferences">
                    <img src={plus} alt="plus icon" className="plus-icon-empty"/>
                    Add My Preferences
                </NavLink>
                
            </div> 
        </>);
    }

    function renderPreferredClasses() {
        if (preferredClasses == null) {
            return renderEmpty();
        } else {
            return <>
                {renderClassRank(1, preferredClasses[1])}
                {renderClassRank(2, preferredClasses[2])}
                {renderClassRank(3, preferredClasses[3])}
            </>
        }
    }

    return (
        <div className="class-preferences-card">
            <NavLink to="/class-preferences">
                    <img className="icon edit-icon" src={edit_icon} alt="Edit"/>
            </NavLink>
            <h2 className="my-profile-title">My Preferences</h2>
            <div className="class-preferences-content">
                {renderPreferredClasses()}
            </div>

        </div>
    )
}

export default ClassPreferencesCardMP;