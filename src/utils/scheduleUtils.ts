import type { EmbeddedSchedule } from "@/models/class";

const DAY_NAMES = [
    "Sunday", 
    "Monday", 
    "Tuesday", 
    "Wednesday", 
    "Thursday", 
    "Friday", 
    "Saturday",
] as const;
  
function parseStartToMinutes(t: number | string): number {
    if (typeof t === "number") return t;
    // t is "HH:mm" or "HH:mm:ss"
    const [hh, mm = "0"] = t.split(":");
    const h = Math.max(0, Math.min(23, Number(hh)));
    const m = Math.max(0, Math.min(59, Number(mm)));
    return h * 60 + m;
}
  
function to12Hour(mins: number): string {
    // Keep within a day for display; wrapping to next day not shown in literal text
    const m = ((mins % (24 * 60)) + (24 * 60)) % (24 * 60);
    let hours = Math.floor(m / 60);
    const minutes = m % 60;
    const ampm = hours >= 12 ? "PM" : "AM";
    const hour12 = hours % 12 || 12;
    const mm = minutes.toString().padStart(2, "0");
    return `${hour12}:${mm} ${ampm}`;
}
  
export const computeLiteralSchedule = (schedule: EmbeddedSchedule): string => {
    const {
      dayOfWeek,
      startTime,
      durationMinutes,
      intervalWeeks = 1,
    } = schedule;
  
    const day = DAY_NAMES[dayOfWeek] ?? "Unknown";
    const startMins = parseStartToMinutes(startTime);
    const endMins = startMins + durationMinutes;
  
    const startStr = to12Hour(startMins);
    const endStr = to12Hour(endMins);
  
    const core = `${day}s, ${startStr} - ${endStr}`;
  
    // If biweekly or more, prepend a short cadence hint
    if (intervalWeeks > 1) {
      return `Every ${intervalWeeks} weeks on ${core}`;
    }
  
    return core;
};
  