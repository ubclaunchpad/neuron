import "./index.css"
import {WeekView} from 'react-weekview'
import moment from 'moment'
import { useEffect, useRef, useState } from "react"
import { SHIFT_TYPES } from '../../data/constants';
import { v4 as uuidv4 } from 'uuid';

const CalendarView = ({selectedDate, shifts}) => {
    const calendarRef = useRef(null);
    const datesMap = {
        "Sun": "Sunday",
        "Mon": "Monday",
        "Tue": "Tuesday",
        "Wed": "Wednesday",
        "Thu": "Thursday",
        "Fri": "Friday",
        "Sat": "Saturday"
    }
    const [events, setEvents] = useState([]);
    const [startDate, setStartDate] = useState(0);
    let buttonsContainer;

    function setEventsColor() {
        const calendarEvents = calendarRef.current.children[0].children[1].children[0].children[0].children[1].children[1].children[0].children;

        // // filter events that are not in this week using moment.js
        // const filteredEvents = events.filter(event => {
        //     const eventStartDate = moment(event.startDate).format('DD'); // Convert event.startDate to a moment object
        //     console.log(eventStartDate)
        //     const referenceDate = moment(startDate, 'DD'); // Convert startDate (from state) to a moment object
        //     console.log(referenceDate)
        //     const startOfWeek = referenceDate.startOf('week'); // Start of the week based on startDate
        //     console.log(startOfWeek)
        //     const endOfWeek = referenceDate.endOf('week');     // End of the week based on startDate
        //     console.log(endOfWeek)

        
        //     // Check if the eventStartDate is within the calculated week
        //     return eventStartDate.isSameOrAfter(startOfWeek) && eventStartDate.isSameOrBefore(endOfWeek);
        // });

        for (let i = 0; i < calendarEvents.length; i++) {
            const event = calendarEvents[i].children[0]
            // Create a vertical line on the left side of the event with the color of the event
            if (events.length > 0) {
                event.style.borderLeft = `6px solid ${events[i]?.color}`
            }
        }

        scrollToCurrentTime();
    }

    function scrollToCurrentTime() {
        // scroll to 8 am
        const time = calendarRef.current.children[0].children[1].children[0].children[0].children[1].children[0].children[0].children[16];
        time.scrollIntoView({behavior: 'smooth', block: 'start'});
    }

    function setButtonsEventListeners(nextPrevButtons) {
        // Get the nextWeek and prevWeek buttons
        const buttons = [...nextPrevButtons.children[0].children];

        buttons.forEach(button => {
            button.addEventListener('click', () => {
                setTimeout(() => {
                    updateEvents(shifts);
                    changeDateStyles();
                    changeTimeTo12HourFormat();
                }, 0)
            })
        });
    }

    function changeTimeTo12HourFormat() {
        let times = [...calendarRef.current.children[0].children[1].children[0].children[0].children[1].children[0].children[0].children[336].children];
        
        times.forEach(time => {
            const timeValue = time.children[0].innerText;
            const newTimeValue = moment(timeValue, 'HH:mm').format('h A');
            time.children[0].innerText = newTimeValue;
        }) 
    }

    function changeEventTimeTo12HourFormat() {
        const calendarEvents = [...calendarRef.current.children[0].children[1].children[0].children[0].children[1].children[1].children[0].children];

        calendarEvents.forEach(event => {
            const eventTimes = event.children[0].children[0].innerText.split('-');
            const newEventTimes = eventTimes.map(time => moment(time, 'HH:mm').format('h:mm A'));
            event.children[0].children[0].innerText = newEventTimes.join(' - ');
        })
    }

    function changeDateStyles() {
        const dates = [...calendarRef.current.children[0].children[1].children[0].children[0].children[0].children[0].children];

        dates.forEach(date => {
            date.classList.remove('justify-center');
            const span = date.children[0];
            if (span.children.length > 1) {
                return;
            }
            const innerText = span.innerText;
            span.innerHTML = `<span>${innerText.substring(4,6)}</span><span>${datesMap[innerText.substring(0,3)]}</span>`;
            span.classList.add('date-styles');
        })
    }

    function changeButtonsPosition() {
        buttonsContainer = document.getElementById('header-buttons');

        const nextPrevButtons = calendarRef.current.children[0].children[0].children[1];
        if (nextPrevButtons) {
            if (buttonsContainer.children.length >= 2) {
                buttonsContainer.children[1].remove();
            }
            nextPrevButtons.classList.add('next-prev-buttons');
            buttonsContainer.appendChild(nextPrevButtons);   
            setButtonsEventListeners(nextPrevButtons);
        }

        const headerContainer = calendarRef.current.children[0].children[0];
        headerContainer.style.display = 'none';
    }

    function updateEvents(shifts) {
        const new_events = [];
        shifts.forEach(shift => {
            let start = moment(shift.start_time, 'HH:mm:ss');
            let end = moment(shift.end_time, 'HH:mm:ss');
            const date = moment(shift.shift_date).format('YYYY-MM-DD');
            start = date + 'T' + start.format('HH:mm:ss');
            end = date + 'T' + end.format('HH:mm:ss');
            let color = 'white';

            if (shift.shift_type === SHIFT_TYPES.MY_SHIFTS) {
                color = 'var(--green)';
            } else if (shift.shift_type === SHIFT_TYPES.COVERAGE) {
                color = 'var(--red)';
            } else if (shift.shift_type === SHIFT_TYPES.MY_COVERAGE_REQUESTS) {
                color = 'var(--yellow)';
            } else if (shift.shift_type === SHIFT_TYPES.DEFAULT) {
                color = 'var(--grey)';
            }

            const id = uuidv4();

            new_events.push({
                id: id,
                title: shift.class_name,
                startDate: moment(start).toDate(),
                endDate: moment(end).toDate(),
                color: color
            });
        });
        setEvents(new_events);
    }

    useEffect(() => {
        const start = moment(calendarRef.current.children[0].children[1].children[0].children[0].children[0].children[0].children[0].children[0].children[0].innerText).format('DD');
        setStartDate(start);

        return () => {
            buttonsContainer.children[1].remove();
        }
        // eslint-disable-next-line
    }, []);

    useEffect(() => {
        updateEvents(shifts);
        changeDateStyles();
        changeTimeTo12HourFormat();
        changeButtonsPosition();
        // eslint-disable-next-line
    }, [shifts]);

    useEffect(() => {
        const start = moment(calendarRef.current.children[0].children[1].children[0].children[0].children[0].children[0].children[0].children[0].children[0].innerText).format('DD');
        setStartDate(start);

        setEventsColor();
        changeEventTimeTo12HourFormat();
        // eslint-disable-next-line
    }, [events]);

    return (
        <div className="calendar-wrapper" ref={calendarRef}>
            <WeekView
                key={shifts}
                weekStartsOn={0}
                events={events}
                initialDate={selectedDate.toDate()}
            />
        </div>
    )
}

export default CalendarView