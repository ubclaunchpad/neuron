import { Temporal } from "@js-temporal/polyfill";

export const toPlainTime = (time: string) => Temporal.PlainTime.from(time);
export const toPlainDate = (date: string) => Temporal.PlainDate.from(date);