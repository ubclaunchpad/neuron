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
    shiftDB: ShiftDB,
    course: Class,
    schedule: Schedule
): Shift {
    return {
        id: shiftDB.id,
        courseId: course.id,
        scheduleId: schedule.id,
        startAt: shiftDB.startAt,
        endAt: shiftDB.endAt,
        date: shiftDB.date,
        canceled: shiftDB.canceled,
        cancelReason: shiftDB.cancelReason ?? undefined,
        canceledAt: shiftDB.canceledAt ?? undefined,
    } as const;
}


// export type ShiftAttendance = {

// }