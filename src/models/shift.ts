import type { ShiftDB } from "@/server/db/schema";
import { getEmbeddedSchedule, getSingleSchedule, type Schedule } from "./schedule";
import { getEmbeddedVolunteer, getListVolunteer, type Volunteer } from "./volunteer";
import { getListClass, type Class } from "./class";

export type Shift = {
  id: string;
  date: string;
  startAt: Date;
  endAt: Date;
  canceled: boolean;
  cancelReason?: string;
  canceledAt?: Date;
  class: Class;
  schedule: Schedule;
  volunteers: Volunteer[];
  coveringVolunteer?: Volunteer;
};

export function buildShift(
  shiftDB: ShiftDB,
  classData: Class,
  schedule: Schedule,
  volunteers: Volunteer[] = [],
  coveringVolunteer?: Volunteer,
): Shift {
  return {
    id: shiftDB.id,
    date: shiftDB.date,
    startAt: shiftDB.startAt,
    endAt: shiftDB.endAt,
    canceled: shiftDB.canceled,
    cancelReason: shiftDB.cancelReason ?? undefined,
    canceledAt: shiftDB.canceledAt ?? undefined,
    class: classData,
    schedule: schedule,
    volunteers: volunteers,
    coveringVolunteer: coveringVolunteer,
  } as const;
}

export function getListShift(s: Shift) {
  return {
    id: s.id,
    date: s.date,
    startAt: s.startAt.toISOString(),
    endAt: s.endAt.toISOString(),
    canceled: s.canceled,
    cancelReason: s.cancelReason,
    canceledAt: s.canceledAt?.toISOString(),
    class: getListClass(s.class),
    schedule: getEmbeddedSchedule(s.schedule),
    volunteers: s.volunteers.map(getListVolunteer),
    coveringVolunteer: s.coveringVolunteer ? getEmbeddedVolunteer(s.coveringVolunteer) : undefined,
  } as const;
}

export function getSingleShift(s: Shift) {
  return {
    id: s.id,
    date: s.date,
    startAt: s.startAt.toISOString(),
    endAt: s.endAt.toISOString(),
    canceled: s.canceled,
    cancelReason: s.cancelReason,
    canceledAt: s.canceledAt?.toISOString(),
    class: getListClass(s.class),
    schedule: getSingleSchedule(s.schedule),
    volunteers: s.volunteers.map(getListVolunteer),
    coveringVolunteer: s.coveringVolunteer ? getEmbeddedVolunteer(s.coveringVolunteer) : undefined,
  } as const;
}

export function getEmbeddedShift(s: Shift) {
  return {
    id: s.id,
    date: s.date,
    startAt: s.startAt.toISOString(),
    endAt: s.endAt.toISOString(),
    className: s.class.name,
    classCategory: s.class.category,
  } as const;
}

export type ListShift = ReturnType<typeof getListShift>;
export type SingleShift = ReturnType<typeof getSingleShift>;
export type EmbeddedShift = ReturnType<typeof getEmbeddedShift>;