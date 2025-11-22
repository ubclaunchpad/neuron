export function isSameDay(day1: Date, day2: Date): boolean {
    return (
        day1.getFullYear() === day2.getFullYear() &&
        day1.getMonth() === day2.getMonth() &&
        day1.getDate() === day2.getDate()
    );
};

// Returns the first Monday before the given date, used for the week header
export function getMonday(date: Date): Date {
    const monday = new Date(date);
    const dayOfWeek = date.getDay();
    const diff = (dayOfWeek + 6) % 7;

    monday.setDate(date.getDate() - diff);
    return monday;
};