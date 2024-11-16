import React, { useEffect, useState } from 'react';
import ScheduleSelector from 'react-schedule-selector';
import './AvailabilityGrid.css';
import { fetchVolunteerAvailability, updateVolunteerAvailability } from '../../api/volunteerService';

const AvailabilityGrid = ({ volunteerId }) => {
  const [unsavedTimes, setUnsavedTimes] = useState([]);
  const [timeoutId, setTimeoutId] = useState(null);

  // Fetch availability when the component mounts
  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const availability = await fetchVolunteerAvailability(volunteerId);
        setUnsavedTimes(availability);
      } catch (error) {
        console.error('Failed to fetch availability:', error);
      }
    };

    fetchAvailability();
  }, [volunteerId]);

  // Handle user interaction with debounced updates
  const handleChange = (newAvailability) => {
    setUnsavedTimes(newAvailability);

    // Clear the previous timeout to prevent unnecessary API calls
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Set a new timeout to update the backend after a delay
    const newTimeoutId = setTimeout(async () => {
      try {
        await updateVolunteerAvailability(volunteerId, newAvailability);
        console.log('Availability updated successfully');
      } catch (error) {
        console.error('Failed to update availability:', error);
      }
    }, 500); // 500ms debounce time

    setTimeoutId(newTimeoutId);
  };

  return (
    <div className="availability-grid">
      <h2>My Availability</h2>
      <ScheduleSelector
        selection={unsavedTimes}
        numDays={5} // Monday to Friday
        minTime={9} // Start time: 9 AM
        maxTime={18} // End time: 6 PM
        hourlyChunks={2} // 30-minute intervals
        onChange={handleChange}
        renderDateCell={(time, selected) => (
          <div className={`slot ${selected ? 'available' : 'unavailable'}`}>
            {selected ? '✔' : ''}
          </div>
        )}
      />
    </div>
  );
};

export default AvailabilityGrid;