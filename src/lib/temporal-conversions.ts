import { Temporal } from "@js-temporal/polyfill";
import { nullthy } from "./nullthy";

export function isoDateToJSDate(iso?: string | null): Date | undefined {
    if (nullthy(iso)) return undefined;
    const pd = Temporal.PlainDate.from(iso);
    return new Date(pd.year, pd.month - 1, pd.day);
}
  
export function jsDateToIsoDate(date: Date | null | undefined): string {
    if (!date) return "";
    const tz = Temporal.Now.timeZoneId();
    const instant = Temporal.Instant.from(date.toISOString());
    const plain = instant.toZonedDateTimeISO(tz).toPlainDate();
    return plain.toString();
}
  
export function timeToJSDate(time?: string): Date | undefined {
    if (!time) return undefined;
    const t = Temporal.PlainTime.from(time);
    return new Date(1970, 0, 1, t.hour, t.minute, t.second, t.millisecond);
}