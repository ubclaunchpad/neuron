import type { ShiftDB } from "@/server/db/schema";
import type { ShiftAttendanceDB } from "@/server/db/schema";
import { getSingleClass, type Class } from "./class"
import { getEmbeddedSchedule, type Schedule } from "./schedule";
import { getEmbeddedVolunteer, type Volunteer } from "./volunteer";


export type Shift = {
  id: string;
  courseId: string;
  scheduleId: string;
  startAt: Date;
  endAt: Date;
  date: string;
  canceled: boolean;
  cancelReason?: string;
  canceledAt?: Date;
};

export function buildShift(
    shiftDB: ShiftDB
): Shift {
    return {
        id: shiftDB.id,
        courseId: shiftDB.courseId,
        scheduleId: shiftDB.scheduleId,
        startAt: shiftDB.startAt,
        endAt: shiftDB.endAt,
        date: shiftDB.date,
        canceled: shiftDB.canceled,
        cancelReason: shiftDB.cancelReason ?? undefined,
        canceledAt: shiftDB.canceledAt ?? undefined,
    } as const;
}

export function getSingleShift(s: Shift) {
    return {
        id: s.id,
        courseId: s.courseId,
        scheduleId: s.scheduleId,
        startAt: s.startAt,
        endAt: s.endAt,
        date: s.date,
        canceled: s.canceled
    }
}


export function getListShift(s: Shift) {
    return {
        id: s.id,
        courseId: s.courseId,
        scheduleId: s.scheduleId,
        startAt: s.startAt,
        endAt: s.endAt,
        date: s.date,
        canceled: s.canceled
    }
}

// export type ShiftAttendance = {

// }