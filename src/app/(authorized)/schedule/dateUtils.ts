export enum CalendarView {
  Month = "dayGridMonth",
  Week = "timeGridWeek",
  Day = "timeGridDay",
}

export function isSameDay(day1: Date, day2: Date): boolean {
  return (
    day1.getFullYear() === day2.getFullYear() &&
    day1.getMonth() === day2.getMonth() &&
    day1.getDate() === day2.getDate()
  );
}

export function isOddDay(day: number, firstDayOfWeek: number): boolean {
  return ((day - firstDayOfWeek + 7) % 7) % 2 === 0;
}

// Returns the first Monday before the given date, used for the week header
export function getMonday(date: Date): Date {
  const monday = new Date(date);
  const dayOfWeek = date.getDay();
  const diff = (dayOfWeek + 6) % 7;

  monday.setDate(date.getDate() - diff);
  return monday;
}

// Given a center date (today usually), generate 12 months before and 12 months ahead
export function generateMonthRange(
  centerDate: Date,
  monthsBefore = 12,
  monthsAfter = 12,
) {
  const result: Date[] = [];

  const beforeDate = new Date(
    centerDate.getFullYear(),
    centerDate.getMonth() - monthsBefore,
    1,
  );

  const total = monthsBefore + monthsAfter + 1;

  for (let i = 0; i < total; ++i) {
    result.push(
      new Date(beforeDate.getFullYear(), beforeDate.getMonth() + i, 1),
    );
  }

  return result;
}
