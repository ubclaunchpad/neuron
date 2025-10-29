import { Temporal } from "@js-temporal/polyfill";

/** Jan–Apr = Spring, May–Aug = Summer, Sep–Dec = Fall */
function semesterForMonth(month: number): string {
  if (month >= 1 && month <= 4) return "Spring";
  if (month <= 8) return "Summer";
  return "Fall";
}

export function getUpcomingSemester(
  monthsAhead = 2,
  timeZone: string = Intl.DateTimeFormat().resolvedOptions().timeZone
): string {
  const now = Temporal.Now.zonedDateTimeISO(timeZone);
  const future = now.add({ months: monthsAhead });
  return semesterForMonth(future.month);
}

export function getCurrentSemester(
  timeZone: string = Intl.DateTimeFormat().resolvedOptions().timeZone
): string {
  const now = Temporal.Now.zonedDateTimeISO(timeZone);
  return semesterForMonth(now.month);
}
