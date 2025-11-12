import { ScheduleType, Weekday, type MonthlyRule, type SingleRule, type WeeklyRule } from "@/models/api/schedule";
import type { EmbeddedSchedule } from "@/models/schedule";
import { Temporal } from "@js-temporal/polyfill";

export const WEEKDAY_TO_TITLE: Record<typeof Weekday.values[number], string> = {
  MO: "Monday",
  TU: "Tuesday",
  WE: "Wednesday",
  TH: "Thursday",
  FR: "Friday",
  SA: "Saturday",
  SU: "Sunday",
};

function weekdayPlural(w: Weekday) { 
  return WEEKDAY_TO_TITLE[w] + "s"; 
}

function freqLabelWeekly(interval: number): string {
  if (interval === 1) return "weekly";
  if (interval === 2) return "bi-weekly";
  return `every ${interval} weeks`;
}

function ordinal(n: number, locale = "en"): string {
  const pr = new Intl.PluralRules(locale, { type: "ordinal" });
  const suf: Record<Intl.LDMLPluralRule, string> = { one:"st", two:"nd", few:"rd", many:"th", other:"th", zero:"th" };
  return `${n}${suf[pr.select(n)] ?? "th"}`;
}

function time12(t: Temporal.PlainTime, withPeriod: boolean): string {
  let h = t.hour % 12; if (h === 0) h = 12;
  const mm = String(t.minute).padStart(2, "0");
  const p = t.hour < 12 ? "AM" : "PM";
  return withPeriod ? `${h}:${mm}${p}` : `${h}:${mm}`;
}

function formatTimeRange(localStartTime: string | Temporal.PlainTime, localEndTime: string | Temporal.PlainTime): string {
  const start = typeof localStartTime === "string" ? Temporal.PlainTime.from(localStartTime) : localStartTime;
  const end = typeof localEndTime === "string" ? Temporal.PlainTime.from(localEndTime) : localEndTime;
  const samePeriod = (start.hour < 12) === (end.hour < 12);
  return samePeriod
    ? `${time12(start, false)}-${time12(end, true)}` // e.g., 9:00-10:30AM
    : `${time12(start, true)}-${time12(end, true)}`; // e.g., 11:30AM-1:00PM
}

function formatEffectiveDates(effectiveStart?: string, effectiveEnd?: string, locale = "en-US"): string {
  if (!effectiveStart && !effectiveEnd) {
    return "";
  }

  const fmt = (d: string) => Temporal.PlainDate.from(d).toLocaleString(locale, { month: "short", day: "numeric" });
  if (effectiveStart && effectiveEnd) {
    return ` from ${fmt(effectiveStart)}-${fmt(effectiveEnd)}`;
  } else if (effectiveStart) {
    return ` after ${fmt(effectiveStart)}`;
  } else {
    return ` until ${fmt(effectiveEnd!)}`;
  }
}

function formatMonthDayGroups(isoDates: string[], locale = "en-US"): string {
  const dates = isoDates
    .map((d) => Temporal.PlainDate.from(d))
    .sort((a, b) => Temporal.PlainDate.compare(a, b));
  const years = new Set(dates.map(d => d.year));
  const includeYear = years.size > 1;

  const monthFmt = new Intl.DateTimeFormat(locale, { month: "short", ...(includeYear ? { year: "numeric" } : {}) });

  // Month -> [days]
  const groups = new Map<string, number[]>();
  for (const d of dates) {
    const month = monthFmt.format(new Date(Date.UTC(d.year, d.month - 1, 1)));
    const arr = groups.get(month) ?? [];
    arr.push(d.day);
    groups.set(month, arr);
  }

  const parts: string[] = [];
  for (const [month, days] of groups) {
    parts.push(`${month} ${days.join(", ")}`);
  }
  return parts.join(", ");
}

export function describeScheduleTime(
  input: EmbeddedSchedule,
): string {
  const timeRange = formatTimeRange(input.localStartTime, input.localEndTime);
  return timeRange;
}

export function describeScheduleDates(
  input: EmbeddedSchedule,
  locale = "en-US",
): string {
  const tailDates = formatEffectiveDates(input.effectiveStart, input.effectiveEnd, locale);
  return tailDates;
}

export function describeScheduleOccurrence(
  input: EmbeddedSchedule,
  locale = "en-US",
): string {
  switch (input.rule.type) {
    case ScheduleType.weekly: {
      const r = input.rule as WeeklyRule;
      return `${weekdayPlural(r.weekday)} ${freqLabelWeekly(r.interval)}`;
    }

    case ScheduleType.monthly: {
      const r = input.rule as MonthlyRule;
      return `${ordinal(r.nth, locale)} ${weekdayPlural(r.weekday)} monthly`;
    }

    case ScheduleType.single: {
      const r = input.rule as SingleRule;

      // Group singles by weekday
      const byWeekday = new Map<Weekday, string[]>();
      for (const iso of r.extraDates) {
        const d = Temporal.PlainDate.from(iso);
        const wk = Weekday.values[d.dayOfWeek]!;
        const arr = byWeekday.get(wk) ?? [];
        arr.push(iso);
        byWeekday.set(wk, arr);
      }

      let datesPart: string;
      if (byWeekday.size === 1) {
        // Single weekday: "Mondays Nov 16, 20, 24, Dec 8, 12"
        const [wk, dates] = byWeekday.entries().next().value!;
        datesPart = `${weekdayPlural(wk)} ${formatMonthDayGroups(dates, locale)}`;
      } else {
        // 2+ weekdays: "Mondays ... and Wednesdays ..." (or more, using ListFormat)
        const pieces = [...byWeekday.entries()]
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([wk, dates]) => `${weekdayPlural(wk)} ${formatMonthDayGroups(dates, locale)}`);
        datesPart = pieces.join(", ");
      }

      return `${datesPart}`;
    }
  }
}

export function describeSchedule(
  input: EmbeddedSchedule,
  locale = "en-US",
): string {
  const timeRange = formatTimeRange(input.localStartTime, input.localEndTime);
  const tailDates = formatEffectiveDates(input.effectiveStart, input.effectiveEnd, locale);
  const occurrence = describeScheduleOccurrence(input, locale);
  return `${occurrence} from ${timeRange}${tailDates}`;
}

type TimeKey = `${string}|${string}`;
function getInfoFromTimeKey(key: TimeKey): [Temporal.PlainTime, Temporal.PlainTime] {
  const [localStartTime, localEndTime] = key.split("|");
  return [Temporal.PlainTime.from(localStartTime!), Temporal.PlainTime.from(localEndTime!)];
}

function dayList(days: Weekday[]): string {
  const names = days
    .slice()
    .sort((a,b) => Weekday.values.indexOf(a) - Weekday.values.indexOf(b))
    .map(weekdayPlural);
  return names.join(", ");
}

function timeList(keys: TimeKey[]): string {
  const times = keys
    .map(getInfoFromTimeKey)
    .sort((a, b) => Temporal.PlainTime.compare(a[0], b[0]))
    .map(t => formatTimeRange(t[0], t[1]));
  return times.join(", ");
}

/**
 * Consolidate a batch of schedules into compact human strings.
 * - Weekly: merge by (effective dates, tzid, interval) and either
 *   (a) combine days when time matches, or
 *   (b) for a single weekday, combine multiple times.
 * - Monthly: same idea, but keyed by (effective dates, tzid, nth).
 * - Singles: not merged, rendered using describeSchedule().
 */
export function consolidateSchedules(
  schedules: EmbeddedSchedule[],
  locale = "en-US",
): string[] {
  const weekly: EmbeddedSchedule[] = [];
  const monthly: EmbeddedSchedule[] = [];
  const out: string[] = [];

  for (const schedule of schedules) {
    if (schedule.rule.type === ScheduleType.weekly) 
      weekly.push(schedule);
    else if (schedule.rule.type === ScheduleType.monthly) 
      monthly.push(schedule);
    else 
      out.push(describeSchedule(schedule, locale)); // No need to consolidate singles
  }

  // Weekly
  type WKey = string; // Group by matching all except time and weekday
  const wGroups = new Map<WKey, EmbeddedSchedule[]>();
  for (const w of weekly) {
    const r = w.rule as WeeklyRule;
    const key = `${w.effectiveStart}|${w.effectiveEnd}|${w.tzid}|${r.interval}`;
    (wGroups.get(key) ?? (wGroups.set(key, []), wGroups.get(key)!)).push(w);
  }

  for (const [groupKey, schedules] of wGroups) {
    const [effectiveStartStr, effectiveEndStr, _, intervalStr] = groupKey.split("|");
    const interval = parseInt(intervalStr!, 10);
    const effectiveStart = effectiveStartStr === "undefined" ? undefined : effectiveStartStr;
    const effectiveEnd = effectiveEndStr === "undefined" ? undefined : effectiveEndStr;

    // Build time -> Set<weekday> and weekday -> Set<time>
    const timeToDays = new Map<TimeKey, Set<Weekday>>();
    const dayToTimes = new Map<Weekday, Set<TimeKey>>();

    for (const s of schedules) {
      const r = s.rule as WeeklyRule;
      const timeKey = `${s.localStartTime}|${s.localEndTime}` as TimeKey;
      (timeToDays.get(timeKey) ?? (timeToDays.set(timeKey, new Set()), timeToDays.get(timeKey)!)).add(r.weekday);
      (dayToTimes.get(r.weekday) ?? (dayToTimes.set(r.weekday, new Set()), dayToTimes.get(r.weekday)!)).add(timeKey);
    }

    const consumed = new Set<string>(); // `${weekday}|${timeKey}` pairs

    // Per-time multi-day lines
    for (const [tKey, daysSet] of timeToDays) {
      if (daysSet.size <= 1)
        continue;

      const days = [...daysSet];
      for (const d of days)
        consumed.add(`${d}|${tKey}`);
      const [localStartTime, durationMinutes] = getInfoFromTimeKey(tKey);
      const headline = `${dayList(days)} ${freqLabelWeekly(interval)} from ${formatTimeRange(localStartTime, durationMinutes)}`;
      const tail = formatEffectiveDates(effectiveStart, effectiveEnd, locale);
      out.push(`${headline}${tail}`);
    }

    // Per-day multi-time lines
    for (const d of Weekday.values) {
      const tset = dayToTimes.get(d);
      if (!tset) continue;
      const remaining = [...tset].filter(tk => !consumed.has(`${d}|${tk}`));
      if (remaining.length === 0) continue;

      const timesStr = timeList(remaining);
      const headline = `${weekdayPlural(d)} ${freqLabelWeekly(interval)} from ${timesStr}`;
      const tail = formatEffectiveDates(effectiveStart, effectiveEnd, locale);
      out.push(`${headline}${tail}`);
    }
  }

  // Monthly
  type MKey = string; // Group by matching all except time and weekday
  const mGroups = new Map<MKey, EmbeddedSchedule[]>();
  for (const m of monthly) {
    const r = m.rule as MonthlyRule;
    const key = `${m.effectiveStart}|${m.effectiveEnd}|${m.tzid}|${r.nth}`;
    (mGroups.get(key) ?? (mGroups.set(key, []), mGroups.get(key)!)).push(m);
  }

  for (const [groupKey, schedules] of mGroups) {
    const [effectiveStartStr, effectiveEndStr, _, nthStr] = groupKey.split("|");
    const nth = parseInt(nthStr!, 10);
    const effectiveStart = effectiveStartStr === "undefined" ? undefined : effectiveStartStr;
    const effectiveEnd = effectiveEndStr === "undefined" ? undefined : effectiveEndStr;

    const timeToDays = new Map<TimeKey, Set<Weekday>>();
    const dayToTimes = new Map<Weekday, Set<TimeKey>>();

    for (const s of schedules) {
      const r = s.rule as MonthlyRule;
      const timeKey = `${s.localStartTime}|${s.localEndTime}` as TimeKey;
      (timeToDays.get(timeKey) ?? (timeToDays.set(timeKey, new Set()), timeToDays.get(timeKey)!)).add(r.weekday);
      (dayToTimes.get(r.weekday) ?? (dayToTimes.set(r.weekday, new Set()), dayToTimes.get(r.weekday)!)).add(timeKey);
    }

    const consumed = new Set<string>();

    // Same-time multi-day lines
    for (const [tKey, daysSet] of timeToDays) {
      if (daysSet.size <= 1) 
        continue;

      const days = [...daysSet];
      for (const d of days) consumed.add(`${d}|${tKey}`);
      const headDays = dayList(days);
      const [localStartTime, durationMinutes] = getInfoFromTimeKey(tKey);
      const headline = `${ordinal(nth, locale)} ${headDays} monthly from ${formatTimeRange(localStartTime, durationMinutes)}`;
      const tail = formatEffectiveDates(effectiveStart, effectiveEnd, locale);
      out.push(`${headline}${tail}`);
    }

    // Per-day multi-time lines
    for (const d of Weekday.values) {
      const tset = dayToTimes.get(d);
      if (!tset) continue;
      const remaining = [...tset].filter(tk => !consumed.has(`${d}|${tk}`));
      if (remaining.length === 0) continue;

      const timesStr = timeList(remaining);
      const headline = `${ordinal(nth, locale)} ${weekdayPlural(d)} monthly from ${timesStr}`;
      const tail = formatEffectiveDates(effectiveStart, effectiveEnd, locale);
      out.push(`${headline}${tail}`);
    }
  }

  return out;
}