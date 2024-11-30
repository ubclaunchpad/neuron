import React, { useEffect, useState } from 'react';
import './index.css';
import { fetchVolunteerAvailability, setVolunteerAvailability, updateVolunteerAvailability } from '../../../api/volunteerService';

import edit_icon from "../../../assets/edit-icon.png"
import check_icon from "../../../assets/check-icon.png";
import cancel_icon from "../../../assets/cancel-icon.png";

const AvailabilityGrid = ({ volunteerId }) => {
  const [unsavedTimes, setUnsavedTimes] = useState([]);
  const [savedTimes, setSavedTimes] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  const timeLabels = ['9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM'];

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const availability = await fetchVolunteerAvailability(volunteerId);

        // map slots to slot keys
        const slotKeys = availability.map((slot) => {
          const hourIndex = (Number(String(slot.start_time).substring(0, 2)) - 9) * 2;
          const minuteIndex = (Number(String(slot.start_time).substring(3, 5))) / 30;
          return `${slot.day_of_week}-${hourIndex + minuteIndex}`
        })

        setUnsavedTimes(slotKeys);
        setSavedTimes(slotKeys);
      } catch (error) {
        console.error('Failed to fetch availability:', error);
      }
    };

    fetchAvailability();
  }, [volunteerId]);

  const handleSlotClick = (dayIndex, timeIndex) => {
    if (!isEditing) return;
    const slotKey = `${dayIndex}-${timeIndex}`;
    setUnsavedTimes((prev) =>
      prev.includes(slotKey)
        ? prev.filter((slot) => slot !== slotKey)
        : [...prev, slotKey]
    );
    setIsEditing(true);
  };

  const handleCheck = async () => {
    try {
      // Transform unsavedTimes into the expected format
      console.log(unsavedTimes)
      const availabilities = unsavedTimes.map((slotKey) => {
        const [dayIndex, timeIndex] = slotKey.split('-').map(Number);
        const day = dayIndex;
        const startHour = Math.floor(timeIndex / 2) + 9; // Assuming timeLabels start at 9 AM
        const startMinute = (timeIndex % 2) * 30;
        const start_time = `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`;

        let endHour;
        let endMinute;
        if (startMinute === 30) {
          endHour = startHour + 1;
          endMinute = 0;
        } else {
          endHour = startHour;
          endMinute = startMinute + 30;
        }
        const end_time = `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;

        return { day, start_time, end_time };
      });
      console.log('Submitting availability:', availabilities); // Debug log statement

      if (savedTimes.length === 0) {
        console.log("ID", volunteerId)
        await setVolunteerAvailability(volunteerId, availabilities);
      } else {
        await updateVolunteerAvailability(volunteerId, availabilities);
      }
      setSavedTimes(unsavedTimes);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update availability:', error);
    }
  };

  const handleCancel = () => {
    setUnsavedTimes(savedTimes);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  }

  return (
    <div className="availability-grid-container">
      <div className="availability-grid-content">
        <div className="availability-header">
          <h2 className="availability-title">My Availability</h2>
          {isEditing ? (
            <div className="edit-options"> 
              <img className="icon check-icon" src={check_icon} alt="Check" hidden={!isEditing} onClick={handleCheck}/>          
              <img className="icon cancel-icon" src={cancel_icon} alt="Cancel" hidden={!isEditing} onClick={handleCancel}/>
          </div>
          ) : (
            <img className="icon edit-icon" src={edit_icon} alt="Edit" hidden={isEditing} onClick={handleEdit}/>
          )}
        </div>
        <div 
          className="availability-grid"
        >
          {/* Row for day labels */}
          <div className="empty-slot"></div> {/* Empty top-left corner */}
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => (
            <div key={`day-${index}`} className="day-label" style={index % 2 === 1 ? { background: "#F7F7F7" } : {}}>
              {day}
            </div>
          ))}
    
          {/* Time labels */}
          {timeLabels.map((time, index) => (
            <div
              key={`time-${index}`}
              className="time-label"
              style={{ gridRow: `${index * 2 + 2} / span 2` }} // Offset by one extra row for headers
            >
              {time}
            </div>
          ))}
    
          {/* Availability slots */}
          {Array(20)
            .fill(null)
            .map((_, timeIndex) =>
              Array(7)
                .fill(null)
                .map((_, dayIndex) => (
                  <div
                    key={`slot-${dayIndex}-${timeIndex}`}
                    className={`slot ${
                      unsavedTimes.includes(`${dayIndex}-${timeIndex}`)
                        ? "available unsaved"
                        : savedTimes.includes(`${dayIndex}-${timeIndex}`)
                        ? "available saved"
                        : "unavailable"
                    }`}
                    onClick={() => handleSlotClick(dayIndex, timeIndex)}
                    style={{ 
                      "background": !unsavedTimes.includes(`${dayIndex}-${timeIndex}`) && 
                      !savedTimes.includes(`${dayIndex}-${timeIndex}`) &&
                      dayIndex % 2 === 1 ? "#F7F7F7" : "",
                      "cursor": isEditing ? "pointer" : ""
                    }}
                  ></div>
                ))
            )}
        </div>
      </div>
    </div>
  );  
};

export default AvailabilityGrid;