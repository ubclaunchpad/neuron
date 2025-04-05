import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
dayjs.extend(utc);

export function convertIndexToDay(index: number): string {
    return dayjs().utc().day(index).format('dddd');
}

export function getDateFromISOString(date?: string): string {
    if (!date) {
        return "";
    }
    return dayjs(date).utc().format("YYYY-MM-DD");
}