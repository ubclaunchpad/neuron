import type { ScheduleDB } from "@/server/db/schema";
import { Temporal } from "@js-temporal/polyfill";
import type { ScheduleType, Weekday } from "./api/schedule";
import { getEmbeddedUser, type User } from "./user";
import type { Volunteer } from "./volunteer";

export type WeeklyRule = {
  type: typeof ScheduleType.weekly;
  weekday: Weekday;
  interval: number;
  localStartTime: string;
  tzid: string;
};

export type MonthlyRule = {
  type: typeof ScheduleType.monthly;
  weekday: Weekday;
  nth: number;
  localStartTime: string;
  tzid: string;
};

export type SingleRule = {
  type: typeof ScheduleType.single;
  extraDates: string[];
  localStartTime: string;
  tzid: string;
};

export type ScheduleRule = WeeklyRule | MonthlyRule | SingleRule;

export type Schedule = {
  id: string;
  durationMinutes: number;
  effectiveStart?: string;
  effectiveEnd?: string;
  rule: ScheduleRule;
  instructors: User[];
  preferredVolunteerCount: number;
  volunteers: Volunteer[];
};

export function buildSchedule(
  scheduleDB: ScheduleDB,
  rule: ScheduleRule,
  instructors: User[] = [],
  volunteers: Volunteer[] = [],
): Schedule {
  return {
    id: scheduleDB.id,
    durationMinutes: scheduleDB.durationMinutes,
    effectiveStart: scheduleDB.effectiveStart ?? undefined,
    effectiveEnd: scheduleDB.effectiveEnd ?? undefined,
    volunteers: volunteers,
    preferredVolunteerCount: scheduleDB.preferredVolunteerCount,
    instructors: instructors,
    rule: rule,
  } as const;
}

export function getSingleSchedule(s: Schedule) {
  const { tzid, ...restRule } = s.rule;

  return {
    id: s.id,
    localStartTime: s.rule.localStartTime,
    localEndTime: Temporal.PlainTime.from(s.rule.localStartTime)
      .add(Temporal.Duration.from({ minutes: s.durationMinutes }))
      .toString(),
    tzid: tzid,
    effectiveStart: s.effectiveStart,
    effectiveEnd: s.effectiveEnd,
    rule: restRule,
    volunteers: s.volunteers.map(getEmbeddedUser),
    preferredVolunteerCount: s.preferredVolunteerCount,
    instructors: s.instructors.map(getEmbeddedUser),
  } as const;
}

export function getEmbeddedSchedule(s: Schedule) {
  const { tzid, ...restRule } = s.rule;

  return {
    id: s.id,
    localStartTime: s.rule.localStartTime,
    localEndTime: Temporal.PlainTime.from(s.rule.localStartTime)
      .add(Temporal.Duration.from({ minutes: s.durationMinutes }))
      .toString(),
    tzid: tzid,
    effectiveStart: s.effectiveStart,
    effectiveEnd: s.effectiveEnd,
    rule: restRule,
  } as const;
}

export type SingleSchedule = ReturnType<typeof getSingleSchedule>;
export type EmbeddedSchedule = ReturnType<typeof getEmbeddedSchedule>;
