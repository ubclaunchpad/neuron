import type { ScheduleType, Weekday } from "@/models/api/schedule";
import type { Locale as DateFnsLocale } from "date-fns";
import { addDays, compareAsc, format, isSameDay } from "date-fns";
import { timeToJSDate } from "./temporal-conversions";

export type ListSeparators = {
  sep: string; // between items except the last two
  final?: string; // between the last two items
};

export interface BaseFormatOptions {
  locale?: DateFnsLocale;
}

export interface TimeRangeFormatOptions extends BaseFormatOptions {
  meridiemSeparator?: string;
  rangeSeparator?: string; // e.g. " - " or " to " or "–"
}

export function formatTimeRange(
  start: Date | string,
  end: Date | string,
  options: TimeRangeFormatOptions = {},
): string {
  const { locale, rangeSeparator = "–", meridiemSeparator = "" } = options;
  const startTime = typeof start === "string" ? timeToJSDate(start)! : start;
  const endTime = typeof end === "string" ? timeToJSDate(end)! : end;

  if (startTime.getTime() === endTime.getTime()) {
    return format(start, "h:mm a", { locale });
  }

  let startPattern = "h";
  if (startTime.getMinutes() !== 0) startPattern += ":mm";
  if (format(startTime, "a", { locale }) !== format(endTime, "a", { locale }))
    startPattern += meridiemSeparator + "a";

  let endPattern = "h";
  if (endTime.getMinutes() !== 0) endPattern += ":mm";
  endPattern += meridiemSeparator + "a";

  const startStr = format(startTime, startPattern, { locale });
  const endStr = format(endTime, endPattern, { locale });

  return `${startStr}${rangeSeparator}${endStr}`;
}

export interface CompressedDateListOptions extends BaseFormatOptions {
  monthPattern?: string; // e.g. "MMM"
  dayPattern?: string; // e.g. "d"
  intraMonthDaySeparator?: string; // between days in same month, e.g. ", "
  monthDayJoiner?: string; // between month and first day, e.g. " "
  listSeparators?: ListSeparators; // between groups, e.g. ", " / ", and "
}

export function joinWithSeparators(
  items: string[],
  separators: ListSeparators,
  empty?: string,
): string {
  const { sep, final } = separators;

  if (items.length === 0) return empty ?? "";
  if (items.length === 1) return items[0]!;
  if (items.length === 2) return `${items[0]}${final ?? sep}${items[1]}`;

  const allButLast = items.slice(0, -1).join(sep);
  const last = items[items.length - 1];
  return `${allButLast}${final ?? sep}${last}`;
}

export function formatCompressedDateList(
  dates: (Date | string)[],
  options: CompressedDateListOptions = {},
): string {
  const {
    locale,
    monthPattern = "MMM",
    dayPattern = "d",
    intraMonthDaySeparator = ", ",
    monthDayJoiner = " ",
    listSeparators = {
      sep: ", ",
      final: ", ",
    },
  } = options;

  if (dates.length === 0) return "";

  const realDates = dates.map((d) => (typeof d === "string" ? new Date(d) : d));
  const sorted = [...realDates].sort(compareAsc);

  type MonthGroup = { key: string; representative: Date; days: Date[] };
  const groupsMap = new Map<string, MonthGroup>();

  for (const date of sorted) {
    const key = format(date, "yyyy-MM", { locale });
    const existing = groupsMap.get(key);
    if (!existing) {
      groupsMap.set(key, { key, representative: date, days: [date] });
    } else {
      const alreadyHas = existing.days.some((d) => isSameDay(d, date));
      if (!alreadyHas) existing.days.push(date);
    }
  }

  const groups = Array.from(groupsMap.values()).sort((a, b) =>
    compareAsc(a.representative, b.representative),
  );

  const groupLabels = groups.map((group) => {
    const monthLabel = format(group.representative, monthPattern, { locale });
    const dayLabels = group.days
      .sort(compareAsc)
      .map((d) => format(d, dayPattern, { locale }));

    if (dayLabels.length === 1) {
      return `${monthLabel}${monthDayJoiner}${dayLabels[0]}`;
    }

    return `${monthLabel}${monthDayJoiner}${dayLabels.join(
      intraMonthDaySeparator,
    )}`;
  });

  return joinWithSeparators(groupLabels, listSeparators);
}

const WEEKDAY_CODE_TO_INDEX: Record<Weekday, number> = {
  // JS Date: 0 = Sunday ... 6 = Saturday
  SU: 0,
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
};

export type RecurrenceFormatStyle = "short" | "long";

export interface RecurrenceFormatOptions extends BaseFormatOptions {
  style?: RecurrenceFormatStyle;

  weekLabel?: string; // "week"
  weeksLabel?: string; // "weeks"
  lastLabel?: string; // "last"
  onLabel?: string; // "On"
  noDatesShortLabel?: string; // "No dates"
  noDatesLongLabel?: string; // "No dates specified"

  weekdayShortPattern?: string; // "EEE" -> "Mon"
  weekdayLongPattern?: string; // "EEEE" -> "Monday"

  compressedDateOptions?: Omit<CompressedDateListOptions, "locale">;
}

export type WeeklyRecurrence = {
  type: typeof ScheduleType.weekly;
  weekday: Weekday;
  interval: number;
};

export type MonthlyRecurrence = {
  type: typeof ScheduleType.monthly;
  weekday: Weekday;
  nth: number;
};

export type SingleRecurrence = {
  type: typeof ScheduleType.single;
  extraDates: string[];
};

export type Recurrence =
  | WeeklyRecurrence
  | MonthlyRecurrence
  | SingleRecurrence;

export function formatScheduleRecurrence(
  recurrence: Recurrence,
  options: RecurrenceFormatOptions = {},
): string {
  switch (recurrence.type) {
    case "weekly":
      return formatWeeklyRecurrence(recurrence, options);
    case "monthly":
      return formatMonthlyRecurrence(recurrence, options);
    case "single":
      return formatDatesRecurrence(recurrence, options);
  }
}

export function weekdayLabel(
  weekday: Weekday,
  style: "short" | "long",
  locale?: DateFnsLocale,
  shortPattern = "EEE",
  longPattern = "EEEE",
): string {
  // base Sunday (2021-01-03 is a Sunday)
  const baseSunday = new Date(2021, 0, 3);
  const index = WEEKDAY_CODE_TO_INDEX[weekday]; // 0..6
  const date = addDays(baseSunday, index);
  const pattern = style === "short" ? shortPattern : longPattern;
  return format(date, pattern, { locale });
}

function nthToOrdinal(
  nth: number,
  locale?: DateFnsLocale,
  lastLabel: string = "last",
): string {
  if (nth === -1) return lastLabel;
  const dummyDate = new Date(2021, 0, nth);
  return format(dummyDate, "do", { locale });
}

export function getFrequencyLabel(rule: Recurrence) {
  switch (rule.type) {
    case "weekly":
      if (rule.interval === 1) return "Weekly";
      if (rule.interval === 2) return "Bi-weekly";
      return `Every ${rule.interval} weeks`;
    case "monthly":
      return "Monthly";
    case "single":
      return "";
  }
}

function formatWeeklyRecurrence(
  recurrence: WeeklyRecurrence,
  options: RecurrenceFormatOptions,
): string {
  const {
    locale,
    style = "long",
    weekLabel = "week",
    weeksLabel = "weeks",
    weekdayShortPattern = "EEEE",
    weekdayLongPattern = "EEEE",
  } = options;

  const weekday = weekdayLabel(
    recurrence.weekday,
    "long",
    locale,
    weekdayShortPattern,
    weekdayLongPattern,
  );

  const { interval } = recurrence;
  const pluralWeeks = interval === 1 ? weekLabel : weeksLabel;

  if (style === "short") {
    if (interval === 1) {
      return `${weekday}s weekly`; // "Mondays weekly"
    }
    if (interval === 2) {
      return `${weekday}s bi-weekly`; // "Mondays bi-weekly"
    }
    return `Every ${interval} ${pluralWeeks} on ${weekday}`; // "Every 2 weeks on Mon"
  }

  if (interval === 1) {
    return `Weekly on ${weekday}s`; // "Weekly on Mondays"
  }
  if (interval === 2) {
    return `Every other week on ${weekday}`;
  }
  return `Every ${interval} ${pluralWeeks} on ${weekday}`;
}

function formatMonthlyRecurrence(
  recurrence: MonthlyRecurrence,
  options: RecurrenceFormatOptions,
): string {
  const {
    locale,
    style = "long",
    lastLabel = "last",
    weekdayShortPattern = "EEEE",
    weekdayLongPattern = "EEEE",
  } = options;

  const weekdayShort = weekdayLabel(
    recurrence.weekday,
    "short",
    locale,
    weekdayShortPattern,
    weekdayLongPattern,
  );
  const weekdayLong = weekdayLabel(
    recurrence.weekday,
    "long",
    locale,
    weekdayShortPattern,
    weekdayLongPattern,
  );

  const nthOrdinal = nthToOrdinal(recurrence.nth, locale, lastLabel);

  if (style === "short") {
    return `${weekdayShort}s monthly`; // "Mondays monthly"
  }

  if (recurrence.nth === -1) {
    return `Monthly on the ${lastLabel} ${weekdayLong}`;
  }
  return `Monthly on the ${nthOrdinal} ${weekdayLong}`;
}

function formatDatesRecurrence(
  recurrence: SingleRecurrence,
  options: RecurrenceFormatOptions,
): string {
  const {
    locale,
    style = "long",
    onLabel = "On",
    noDatesShortLabel = "No dates",
    noDatesLongLabel = "No dates specified",
    compressedDateOptions,
  } = options;

  if (recurrence.extraDates.length === 0) {
    return style === "short" ? noDatesShortLabel : noDatesLongLabel;
  }

  const dates = recurrence.extraDates.map((d) => new Date(d));
  const compressed = formatCompressedDateList(dates, {
    ...(compressedDateOptions || {}),
    locale,
  });

  if (style === "short") {
    return compressed; // just the list
  }
  return `${onLabel} ${compressed}`; // "On May 11, 21, March 13"
}
