import { getImageUrlFromKey } from "@/lib/build-image-url";
import type { SingleClass } from "@/models/class";
import type {
  ScheduleEditSchemaInput,
  ScheduleRuleEditSchemaType,
} from "./schedule-form/schema";
import type { ClassEditSchemaType } from "./schema";

export function classToFormValues(c?: SingleClass): ClassEditSchemaType {
  return {
    name: c?.name ?? "",
    description: c?.description ?? "",
    meetingURL: c?.meetingURL ?? "",
    category: c?.category ?? "",
    subcategory: c?.subcategory ?? "",
    image: getImageUrlFromKey(c?.image) ?? null,
    levelRange: [c?.lowerLevel ?? 1, c?.upperLevel ?? 4],
    schedules:
      c?.schedules.map((s) => ({
        id: s.id,
        localStartTime: s.localStartTime,
        localEndTime: s.localEndTime,
        tzid: s.tzid,
        volunteers: s.volunteers.map((v) => ({
          id: v.id,
          label: `${v.name} ${v.lastName}`,
          email: v.email,
        })),
        preferredVolunteerCount: s.preferredVolunteerCount,
        instructors: s.instructors.map((i) => ({
          id: i.id,
          label: `${i.name} ${i.lastName}`,
          email: i.email,
        })),
        rule: scheduleRuleToFormValues(s.rule),
        effectiveStart: s.effectiveStart,
        effectiveEnd: s.effectiveEnd,
      })) ?? [],
  };
}

export function scheduleRuleToFormValues(r: ScheduleRuleEditSchemaType): any {
  return {
    type: r.type,
    extraDates: r.type === "single" ? r.extraDates : [],
    weekday: r.type !== "single" ? r.weekday : "",
    nth: r.type === "monthly" ? r.nth.toString() : "",
    interval: r.type === "weekly" ? r.interval.toString() : "",
  };
}

export function buildEmptySchedule(): ScheduleEditSchemaInput {
  return {
    localStartTime: "",
    localEndTime: "",
    volunteers: [],
    instructors: [],
    preferredVolunteerCount: "",
    rule: {
      type: "weekly",
      weekday: "",
      interval: "",
      nth: "",
      extraDates: [],
    } as any,
  };
}
