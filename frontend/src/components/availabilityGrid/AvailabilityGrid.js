// frontend/src/components/availabilityGrid/AvailabilityGrid.js

import React, { useState } from 'react';
import ScheduleSelector from 'react-schedule-selector';
import './AvailabilityGrid.css';

const AvailabilityGrid = ({ availability, setAvailability }) => {
  // Initialize selected times from props or set to an empty array if not provided
  const [selectedTimes, setSelectedTimes] = useState(availability || []);

  // Handle changes in selected times
  const handleChange = (newAvailability) => {
    setSelectedTimes(newAvailability);
    setAvailability(newAvailability); // Pass changes up if needed
  };

  return (
    <div className="availability-grid">
      <h2>My Availability</h2>
      <ScheduleSelector
        selection={selectedTimes}
        numDays={5} // Monday to Friday
        minTime={9} // Start time (9 AM)
        maxTime={18} // End time (6 PM)
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