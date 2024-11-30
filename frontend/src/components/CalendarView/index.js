import "./index.css"
import {WeekView} from 'react-weekview'
import moment from 'moment'
import { useEffect, useRef } from "react"

const CalendarView = () => {
    const calendarRef = useRef(null);

    const prop_events = [
        {
            id: 1,
            title: 'Event 1',
            startDate: moment('2024-11-24T01:30:00').toDate(),
            endDate: moment('2024-11-24T03:15:00').toDate(),
            color: 'red'
        },
        
        {
            id: 2,
            title: 'Event 2',
            startDate: moment('2024-11-26T02:30:00').toDate(),
            endDate: moment('2024-11-26T03:15:00').toDate(),
            color: 'green'
        }
    ]

    const toBeAddedEvents = prop_events.map(event => {
        return {
            id: event.id,
            title: event.title,
            startDate: event.startDate,
            endDate: event.endDate,
        }
    })

    function setEventsColor() {
        const calendarEvents = calendarRef.current.children[0].children[1].children[0].children[0].children[1].children[1].children[0].children;

        for (let i = 0; i < calendarEvents.length; i++) {
            const event = calendarEvents[i].children[0]
            // Create a vertical line on the left side of the event with the color of the event
            event.style.borderLeft = `6px solid ${prop_events[i].color}`
        }
    }

    function setButtonsEventListeners() {
        // Get the nextWeek and prevWeek buttons
        let buttons = [calendarRef.current.children[0].children[0].children[0]];
        buttons = [...buttons, ...calendarRef.current.children[0].children[0].children[1].children[0].children];

        buttons.forEach(button => {
            button.addEventListener('click', () => {
                setTimeout(() => {
                    setEventsColor();
                }, 0)
            })
        });
    }

    function changeTimeTo12HourFormat() {
        let times = [...calendarRef.current.children[0].children[1].children[0].children[0].children[1].children[0].children[0].children[336].children];
        
        times.forEach(time => {
            const timeValue = time.children[0].innerText;
            console.log(timeValue)
            const newTimeValue = moment(timeValue, 'HH:mm').format('h A');
            time.children[0].innerText = newTimeValue;
        }) 
        
        changeEventTimeTo12HourFormat();
    }

    function changeEventTimeTo12HourFormat() {
        const calendarEvents = [...calendarRef.current.children[0].children[1].children[0].children[0].children[1].children[1].children[0].children];

        calendarEvents.forEach(event => {
            const eventTimes = event.children[0].children[0].innerText.split('-');
            console.log(eventTimes) 
            const newEventTimes = eventTimes.map(time => moment(time, 'HH:mm').format('h:mm A'));
            event.children[0].children[0].innerText = newEventTimes.join(' - ');
        })
    }

    useEffect(() => {
        setEventsColor();
        setButtonsEventListeners();
        changeTimeTo12HourFormat();
        // eslint-disable-next-line
    }, []);



    return (
        <div className="calendar-wrapper" ref={calendarRef}>
            <WeekView
                weekStartsOn={0}
                events={toBeAddedEvents}
                onCellClick={(date) => console.log('Cell clicked', date)}
            />
        </div>
    )
}

export default CalendarView