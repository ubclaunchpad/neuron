import React from 'react'
import VolunteerLayout from '../../components/volunteerLayout'
import CalendarView from '../../components/CalendarView'

const VolunteerSchedule = () => {
  return (
    <div>
      <VolunteerLayout  pageTitle="Schedule" pageContent={<CalendarView />} />
    </div>
  )
}

export default VolunteerSchedule