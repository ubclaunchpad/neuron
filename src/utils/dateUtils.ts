import { Temporal } from "@js-temporal/polyfill";

export function isoDateToJSDate(iso?: string): Date | undefined {
    if (!iso) return undefined;
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
  