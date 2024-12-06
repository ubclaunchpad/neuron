import "./index.css";
import React from "react";
import { MdOutlineDragIndicator } from "react-icons/md";
import edit_icon from "../../../assets/edit-icon.png"

function ClassPreferenceBox({ index, preference, handleDragStart, handleDrop }) {
    
    return (
        <div 
            className="class-preference-box"
            draggable 
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, index)}
        >
            <div className="class-preference-index">
                <div>
                    {index + 1}
                </div>
            </div>
            <div className="class-preference">
                <div className="class-preference-icon">
                    <MdOutlineDragIndicator />
                </div>
                <div className="class-preference-text">{preference}</div>
            </div>
        </div>
    )
}

function ClassPreferencesCard({ volunteer }) {

    const [boxes, setBoxes] = React.useState([]);
    const [draggedBoxIndex, setDraggedBoxIndex] = React.useState(null);

    React.useEffect(() => {
        setBoxes([
            { id: 1, name: "Online Exercise" },
            { id: 2, name: "Creative & Expressive" },
            { id: 3, name: "Care Partner Workshops" },
            { id: 4, name: "In-Person Exercise" },
            { id: 5, name: "One-On-One Exercise" },
            { id: 6, name: "Food & Nutrition" }
        ])
    }, []);

    const handleDragStart = (e, index) => {
        setDraggedBoxIndex(index);
    };

    const handleDrop = (e, index) => {
        e.preventDefault();
        const updatedBoxes = [...boxes];
        const [movedRectangle] = updatedBoxes.splice(draggedBoxIndex, 1);
        updatedBoxes.splice(index, 0, movedRectangle);
        setBoxes(updatedBoxes);
    };
    
    return (
        <div className="class-preferences-card">
            <img className="icon edit-icon" src={edit_icon} alt="Edit"/>
            <h2>Class Preferences</h2>
            <div className="class-preferences-column">
                {boxes.map((box, index) => {
                    return (
                        <ClassPreferenceBox
                            key={box.id}
                            index={index} 
                            preference={box.name}
                            handleDragStart={handleDragStart}
                            handleDrop={handleDrop}
                        />
                    )
                })}
            </div>
        </div>
    )
}

export default ClassPreferencesCard;