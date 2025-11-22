import React from "react";
import { useState, useEffect } from "react";
import type { CalendarControls } from "./useCalendarApi";

// Below this width in px our calendar will switch to a day view
const DAYVIEW_TRIGGER = 600;

// Returns the first Monday before the given date, used for the week header
function getMonday(date: Date): Date {
    const monday = new Date(date);
    const dayOfWeek = date.getDay();
    const diff = (dayOfWeek + 6) % 7;

    monday.setDate(date.getDate() - diff);
    return monday;
};

function isSameDay(day1: Date, day2: Date): boolean {
    return (
        day1.getFullYear() === day2.getFullYear() &&
        day1.getMonth() === day2.getMonth() &&
        day1.getDate() === day2.getDate()
    );
}

export function useDayView({ 
    calendarApi,
    next,
    prev, 
    changeView, 
    getDate, 
    goToDate 
}: CalendarControls) 
{
    const [isDayView, setIsDayView] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));

    // isDayView
    useEffect(() => {
        const checkWidth = () => setIsDayView(window.innerWidth < DAYVIEW_TRIGGER);
        checkWidth();
        window.addEventListener("resize", checkWidth);
        return () => window.removeEventListener("resize", checkWidth);
    }, []);

    // weekStart
    useEffect(() => {
        const endOfWeek: Date = new Date(weekStart);
        endOfWeek.setDate(endOfWeek.getDate() + 6);

        if (selectedDate < weekStart || selectedDate > endOfWeek) 
            setWeekStart(getMonday(selectedDate));
    }, [selectedDate]);

    // Clicking on header changes day view to display target day
    const handleDayClick = (date: Date) => {
        if (!calendarApi) return;
        setSelectedDate(date);
        calendarApi.changeView("timeGridDay", date);
    };

    const renderDayViewHeader = () => {
        return <div className="dayView-header">{
            Array.from({ length: 7 }, (_, i) => {
                const curDate = new Date(weekStart);
                curDate.setDate(weekStart.getDate() + i);
                
                const dayName = curDate.toLocaleDateString("en-US", { weekday: "short" });
                const dayNum  = curDate.getDate();
                
                const isSelected = isSameDay(curDate, selectedDate);

                return (
                    <div
                        key={i}
                        onClick={() => handleDayClick(curDate)}
                        className={`
                            fc-col-header-cell
                            dayview-header-date
                            ${isSelected ? "dayview-header-date-selected" : ""}    
                        `}
                    >
                        <div style={{ fontSize: "24px" }}>{dayNum}</div>
                        <div style={{ fontSize: "14px" }}>{dayName}</div>
                    </div>
                );
        })
        }</div>
    };
        
    return { isDayView, setSelectedDate, renderDayViewHeader };
}