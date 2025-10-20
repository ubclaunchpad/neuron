import type { ScheduleDB } from "@/server/db/schema";
import type { ScheduleRule } from "./api/schedule";
import { getEmbeddedInstructor, type Instructor } from "./instructor";
import { getEmbeddedVolunteer, type Volunteer } from "./volunteer";

export type Schedule = {
  id: string;
  durationMinutes: number;
  effectiveStart?: string;
  effectiveEnd?: string;
  rule: ScheduleRule;
  instructors: Instructor[];
  volunteers: Volunteer[];
};

export function buildSchedule(
  scheduleDB: ScheduleDB,
  rule: ScheduleRule,
  instructors: Instructor[] = [],
  volunteers: Volunteer[] = [],
): Schedule {
  return {
    id: scheduleDB.id,
    durationMinutes: scheduleDB.durationMinutes,
    effectiveStart: scheduleDB.effectiveStart ?? undefined,
    effectiveEnd: scheduleDB.effectiveEnd ?? undefined,
    volunteers: volunteers,
    instructors: instructors,
    rule: rule,
  } as const;
}

export function getSingleSchedule(s: Schedule) {
  return {
    id: s.id,
    effectiveStart: s.effectiveStart,
    effectiveEnd: s.effectiveEnd,
    durationMinutes: s.durationMinutes,
    rule: s.rule,
    volunteers: s.volunteers.map(getEmbeddedVolunteer),
    instructors: s.instructors.map(getEmbeddedInstructor),
  } as const;
}

export function getEmbeddedSchedule(s: Schedule) {
  return {
    id: s.id,
    durationMinutes: s.durationMinutes,
    effectiveStart: s.effectiveStart,
    effectiveEnd: s.effectiveEnd,
    rule: s.rule
  } as const;
}

export type SingleSchedule = ReturnType<typeof getSingleSchedule>;
export type EmbeddedSchedule = ReturnType<typeof getEmbeddedSchedule>;
