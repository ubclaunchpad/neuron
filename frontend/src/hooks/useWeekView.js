import { useEffect, useState, useCallback } from 'react';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import weekday from 'dayjs/plugin/weekday';
import isToday from 'dayjs/plugin/isToday';
import utc from 'dayjs/plugin/utc';

dayjs.extend(isoWeek);
dayjs.extend(weekday);
dayjs.extend(isToday);
dayjs.extend(utc);

// Utility to get day suffix like 'st', 'nd', 'rd', 'th'
function getDaySuffix(day) {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

// Generate 48 half-hour time slots for a given date
function generateCellsForDay(baseDate) {
  const cells = [];
  for (let i = 0; i < 48; i++) {
    const time = baseDate.startOf('day').add(i * 30, 'minute');
    cells.push({
      date: time.toISOString(),
      hour: time.format('HH'),
      minute: time.format('mm'),
      hourAndMinute: time.format('HH:mm'),
      disabled: false, // You can customize this
    });
  }
  return cells;
}

// Generate full day object
function generateDayObject(date) {
  const day = date.date();
  return {
    date: date.toISOString(),
    isToday: date.isToday(),
    name: date.format('dddd'), // Full name, e.g. "Monday"
    shortName: date.format('ddd'), // Short name, e.g. "Mon"
    dayOfMonth: `${day}`,
    dayOfMonthWithZero: day.toString().padStart(2, '0'),
    dayOfMonthWithSuffix: `${day}${getDaySuffix(day)}`,
    disabled: false,
    cells: generateCellsForDay(date),
  };
}

// Generate week (Monday to Sunday)
function getWeekDays(start) {
  return Array.from({ length: 7 }, (_, i) => generateDayObject(start.add(i, 'day')));
}

export function useWeekView(selectedDate) {
  const fallbackDate = selectedDate || dayjs(); // fallback to today if selectedDate is undefined
  const [initialDate, setInitialDate] = useState(fallbackDate.startOf('isoWeek'));
  const [days, setDays] = useState(getWeekDays(fallbackDate.startOf('isoWeek')));

  useEffect(() => {
    if (!selectedDate) return; // avoid running if selectedDate is undefined
    const newStart = selectedDate.startOf('isoWeek');
    if (!newStart.isSame(initialDate, 'day')) {
      setInitialDate(newStart);
      setDays(getWeekDays(newStart.clone()));
    }
  }, [selectedDate]);

  const nextWeek = useCallback(() => {
    const next = initialDate.add(1, 'week');
    setInitialDate(next);
    setDays(getWeekDays(next.clone()));
  }, [initialDate]);

  const previousWeek = useCallback(() => {
    const prev = initialDate.subtract(1, 'week');
    setInitialDate(prev);
    setDays(getWeekDays(prev.clone()));
  }, [initialDate]);

  const goToToday = useCallback(() => {
    const todayStart = dayjs().startOf('isoWeek');
    setInitialDate(todayStart);
    setDays(getWeekDays(todayStart.clone()));
  }, []);

  return {
    days,
    nextWeek,
    previousWeek,
    goToToday,
  };
}
