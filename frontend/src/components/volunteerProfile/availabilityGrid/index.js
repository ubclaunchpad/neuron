import React, { useEffect, useState } from 'react';
import './index.css';
import { fetchVolunteerAvailability, updateVolunteerAvailability } from '../../../api/volunteerService';

const AvailabilityGrid = ({ volunteerId }) => {
  const [unsavedTimes, setUnsavedTimes] = useState([]);
  const [savedTimes, setSavedTimes] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  const timeLabels = ['9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM'];

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const availability = await fetchVolunteerAvailability(volunteerId);
        setUnsavedTimes(availability);
        setSavedTimes(availability);
      } catch (error) {
        console.error('Failed to fetch availability:', error);
      }
    };

    fetchAvailability();
  }, [volunteerId]);

  const handleSlotClick = (dayIndex, timeIndex) => {
    const slotKey = `${dayIndex}-${timeIndex}`;
    setUnsavedTimes((prev) =>
      prev.includes(slotKey)
        ? prev.filter((slot) => slot !== slotKey)
        : [...prev, slotKey]
    );
    setIsEditing(true);
  };

  const handleSubmit = async () => {
    try {
      // Transform unsavedTimes into the expected format
      const availabilities = unsavedTimes.map((slotKey) => {
        const [dayIndex, timeIndex] = slotKey.split('-').map(Number);
        const day = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][dayIndex];
        const startHour = Math.floor(timeIndex / 2) + 9; // Assuming timeLabels start at 9 AM
        const startMinute = (timeIndex % 2) * 30;
        const start_time = `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`;
        const end_time = `${String(startHour).padStart(2, '0')}:${String(startMinute + 30).padStart(2, '0')}`;

        return { day, start_time, end_time };
      });
      console.log('Submitting availability:', availabilities); // Debug log statement
      await updateVolunteerAvailability(volunteerId, availabilities);
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

  return (
    <div className="availability-grid-container">
      <div className="availability-grid-content">
        <div className="availability-header">
          <h2 className="availability-title">My Availability</h2>
          {isEditing ? (
            <div className="action-buttons">
              <div className="submit-icon" onClick={handleSubmit}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 20 17" fill="none">
                  <path d="M19.584 1.20403C20.1419 1.82893 20.1419 2.84377 19.584 3.46867L8.15666 16.2667C7.59869 16.8916 6.69254 16.8916 6.13457 16.2667L0.420921 9.86768C-0.137052 9.24277 -0.137052 8.22793 0.420921 7.60303C0.978895 6.97813 1.88504 6.97813 2.44302 7.60303L7.14785 12.8672L17.5663 1.20403C18.1243 0.579126 19.0305 0.579126 19.5884 1.20403H19.584Z" fill="#189531" />
                </svg>
              </div>
              <div className="cancel-icon" onClick={handleCancel}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 17" fill="none">
                  <g clip-path="url(#clip0_509_6275)">
                    <path d="M15.5289 3.46782C16.1536 2.84311 16.1536 1.82859 15.5289 1.20388C14.9042 0.579175 13.8897 0.579175 13.265 1.20388L8.00244 6.47141L2.73491 1.20888C2.1102 0.584172 1.09568 0.584172 0.470972 1.20888C-0.153735 1.83359 -0.153735 2.84811 0.470972 3.47282L5.7385 8.73535L0.47597 14.0029C-0.148738 14.6276 -0.148738 15.6421 0.47597 16.2668C1.10068 16.8915 2.1152 16.8915 2.73991 16.2668L8.00244 10.9993L13.27 16.2618C13.8947 16.8865 14.9092 16.8865 15.5339 16.2618C16.1586 15.6371 16.1586 14.6226 15.5339 13.9979L10.2664 8.73535L15.5289 3.46782Z" fill="#952018" />
                  </g>
                  <defs>
                    <clipPath id="clip0_509_6275">
                      <rect width="16" height="16" fill="white" transform="translate(0.00244141 0.735352)" />
                    </clipPath>
                  </defs>
                </svg>
              </div>
            </div>
          ) : (
            <div className="deselected-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="17" viewBox="0 0 16 17" fill="none">
                <g clip-path="url(#clip0_509_5373)">
                  <path
                    d="M0.827148 15.9379C0.827148 16.1493 0.911143 16.3521 1.06065 16.5016C1.21016 16.6511 1.41294 16.7351 1.62438 16.7351H14.3802C14.5916 16.7351 14.7944 16.6511 14.9439 16.5016C15.0934 16.3521 15.1774 16.1493 15.1774 15.9379C15.1774 15.7264 15.0934 15.5236 14.9439 15.3741C14.7944 15.2246 14.5916 15.1406 14.3802 15.1406H1.62438C1.41295 15.1406 1.21017 15.2246 1.06067 15.3741C0.911157 15.5236 0.827159 15.7264 0.827148 15.9379Z"
                    fill="#808080"
                  />
                  <path
                    d="M2.92846 13.8367H5.18315C5.39259 13.8373 5.60007 13.7964 5.79358 13.7163C5.98709 13.6362 6.16278 13.5184 6.31049 13.37L13.9699 5.71058C14.2681 5.41126 14.4356 5.00591 14.4355 4.58335C14.4354 4.1608 14.2678 3.75551 13.9695 3.45629L11.714 1.20083C11.4146 0.902656 11.0093 0.735278 10.5868 0.735352C10.1643 0.735425 9.75899 0.902943 9.45972 1.20122L1.80073 8.86021C1.65225 9.00791 1.53454 9.18361 1.45442 9.37712C1.3743 9.57063 1.33337 9.77811 1.33399 9.98755V12.2422C1.33441 12.665 1.50254 13.0703 1.80147 13.3692C2.1004 13.6682 2.50571 13.8363 2.92846 13.8367ZM10.5871 2.32856L12.8421 4.58363L11.7144 5.71136L9.45934 3.45629L10.5871 2.32856ZM8.33199 4.58363L10.5871 6.8387L5.18315 12.2426L2.92846 12.2422L2.92807 9.98755L8.33199 4.58363Z"
                    fill="#808080"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_509_5373">
                    <rect width="16" height="16" fill="white" transform="translate(0.00195312 0.735352)" />
                  </clipPath>
                </defs>
              </svg>
            </div>
          )}
        </div>
        <div className="availability-grid">
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
                    style={
                      !unsavedTimes.includes(`${dayIndex}-${timeIndex}`) && 
                      !savedTimes.includes(`${dayIndex}-${timeIndex}`) &&
                      dayIndex % 2 === 1 ? 
                        { "background": "#F7F7F7"
                         } : {}}
                  ></div>
                ))
            )}
        </div>
      </div>
    </div>
  );  
};

export default AvailabilityGrid;