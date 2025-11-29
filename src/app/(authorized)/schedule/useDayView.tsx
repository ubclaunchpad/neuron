import React from "react";
import { useState, useEffect } from "react";
import type { CalendarControls } from "./useCalendarApi";
import { getMonday, isSameDay } from "./dateUtils";

// Below this width in px our calendar will switch to a day view
const DAYVIEW_TRIGGER = 600;

export function useDayView({ 
    calendarApi,
    calendarContainerRef,
}: CalendarControls & { calendarContainerRef: React.RefObject<HTMLElement | null> }) 
{
    const [isDayView, setIsDayView] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));

    useEffect(() => {
        const el = calendarContainerRef.current;
        if (!el) return;

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const width = entry.contentRect.width;
                setIsDayView(width < DAYVIEW_TRIGGER);
            }
        });

        observer.observe(el);
        return () => observer.disconnect();
    }, [calendarContainerRef]);

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
        return <div className="dayview-header">{
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
        
    return { isDayView, selectedDate, setSelectedDate, renderDayViewHeader };
}