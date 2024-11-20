import React, { useEffect, useState } from 'react';
import './AvailabilityGrid.css';
import { fetchVolunteerAvailability, updateVolunteerAvailability } from '../../api/volunteerService';

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
      await updateVolunteerAvailability(volunteerId, unsavedTimes);
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
      <div className="availability-header">
        <h2 className="availability-title">My Availability</h2>
        {isEditing && (
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
        )}
      </div>
      <div className="availability-grid">
        {/* Row for day labels */}
        <div className="empty-slot"></div> {/* Empty top-left corner */}
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => (
          <div key={`day-${index}`} className="day-label">
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
                    unsavedTimes.includes(`${dayIndex}-${timeIndex}`) ? "available" : "unavailable"
                  }`}
                  onClick={() => handleSlotClick(dayIndex, timeIndex)}
                ></div>
              ))
          )}
      </div>
    </div>
  );
};

export default AvailabilityGrid;