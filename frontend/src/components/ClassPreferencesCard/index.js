import './index.css'; 
import dropdown_button from "../../assets/dropdown-button.png";
import { useState } from 'react';
function ClassPreferencesCard({ classData, fullWith, showDropdown }) {
    let card_width;
    if (fullWith) {
        card_width = "90%";
    } else {
        card_width = "40%";
    }

    if (showDropdown === undefined || showDropdown === null) showDropdown = true;

    const RANK1_COLOR = "rgba(67, 133, 172, 1)";
    const RANK2_COLOR = "rgba(67, 133, 172, 0.7)";
    const RANK3_COLOR = "rgba(67, 133, 172, 0.3)";

    const rank = classData.class_rank;
    const name = classData.class_name;
    const instruction = classData.instructions;
    const start_time = classData.start_time;
    const end_time = classData.end_time;
    const days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
    ];
    const [collapse, setCollapse] = useState(false);

    let lineColor; 
    if (rank === 1) {
        lineColor = RANK1_COLOR;
    } else if (rank === 2) {
        lineColor = RANK2_COLOR;
    } else {
        lineColor = RANK3_COLOR;
    }

    const formatTime = (time) => {
        if (time === null || time === undefined || time === "") return "";

        const [hour, minute] = time.split(":").map(Number);
        const period = hour >= 12 ? "PM" : "AM";
        const formattedHour = hour % 12 || 12;
        return [`${formattedHour}:${minute.toString().padStart(2, "0")}`, period];
    };

    const formatDur = (s_time, e_time) => {
        const s_time_ = formatTime(s_time);
        const e_time_ = formatTime(e_time);
        if (s_time_[1] == e_time_[1]) {
            return `${s_time_[0]} - ${e_time_[0]}${s_time_[1]}`;
        } else {
            return `${s_time_[0]}${s_time_[1]} - ${e_time_[0]}${e_time_[1]}`;
        }
    };

    const capitalize = (wrd) => {
        return wrd.charAt(0).toUpperCase() + wrd.slice(1);
    }

    const getDate = (date) => {
        const date_ = new Date(date);
        const d = date_.getDate().toString().padStart(2, "0");
        const m = (date_.getMonth()+1).toString().padStart(2, "0");
        const y = (date_.getFullYear()).toString();
        return `${d}/${m}/${y}`;
    };

    return (
        <div className="class-pref-card" style={{width: card_width}} >
            <div className='pref-main-content'>
                <div className="vertical-line" style={{ backgroundColor: lineColor }} />
                <div className="card-content">
                    <div className="column segment-1">
                        <div className="card-text">
                            <div className="class-pref-time">{days[classData["day"]]}</div>
                            <p>{formatDur(start_time, end_time)}</p>
                        </div>
                    </div>
                    <div className="column segment-2">
                        <div className="card-text">
                            <div>{name}</div>
                            <p>{capitalize(classData["frequency"])} | Starts on {getDate(classData["start_date"])}</p>
                        </div>
                    </div>
                </div>
            </div>
            { showDropdown ? 
                <img src={dropdown_button} className={`dropdown-button ${collapse ? 'collapse' : ''}`} onClick={()=>setCollapse(!collapse)}/>
                : null
            }
            {!collapse ? null : 
                <div className='pref-card-intrs'>{classData["instructions"]}</div>
            }
        </div>
    );
}

export default ClassPreferencesCard;