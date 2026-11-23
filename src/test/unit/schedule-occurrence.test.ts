import { describe, expect, it } from "vitest";
import { NEURON_TIMEZONE } from "@/lib/constants";
import { expandScheduleOccurrences } from "@/server/services/entity/classService";

describe("expandScheduleOccurrences", () => {
  describe("single-date schedules", () => {
    it("preserves a sole explicit date on the term start boundary", () => {
      const occurrences = expandScheduleOccurrences({
        rule: {
          type: "single",
          extraDates: ["2027-01-04"],
          localStartTime: "10:00:00",
          tzid: NEURON_TIMEZONE,
        },
        durationMinutes: 60,
        termStartDate: "2027-01-04",
        termEndDate: "2027-04-30",
        blackouts: [],
      });

      expect(occurrences).toHaveLength(1);
      expect(occurrences[0]!.date).toBe("2027-01-04");
      expect(occurrences[0]!.startAt).toBe("2027-01-04T18:00:00Z");
      expect(occurrences[0]!.endAt).toBe("2027-01-04T19:00:00Z");
    });

    it("preserves explicit dates on both start and end boundaries", () => {
      const occurrences = expandScheduleOccurrences({
        rule: {
          type: "single",
          extraDates: ["2027-04-30", "2027-01-04"],
          localStartTime: "10:00:00",
          tzid: NEURON_TIMEZONE,
        },
        durationMinutes: 90,
        termStartDate: "2027-01-04",
        termEndDate: "2027-04-30",
        blackouts: [],
      });

      expect(occurrences.map((o) => o.date)).toEqual([
        "2027-01-04",
        "2027-04-30",
      ]);
      // Jan 4 is PST (UTC-8), Apr 30 is PDT (UTC-7)
      expect(occurrences[0]!.startAt).toBe("2027-01-04T18:00:00Z");
      expect(occurrences[0]!.endAt).toBe("2027-01-04T19:30:00Z");
      expect(occurrences[1]!.startAt).toBe("2027-04-30T17:00:00Z");
      expect(occurrences[1]!.endAt).toBe("2027-04-30T18:30:00Z");
    });

    it("preserves an explicit date when startDate equals endDate", () => {
      const occurrences = expandScheduleOccurrences({
        rule: {
          type: "single",
          extraDates: ["2027-01-04"],
          localStartTime: "14:00:00",
          tzid: NEURON_TIMEZONE,
        },
        durationMinutes: 60,
        termStartDate: "2027-01-04",
        termEndDate: "2027-01-04",
        blackouts: [],
      });

      expect(occurrences.map((o) => o.date)).toEqual(["2027-01-04"]);
    });

    it("respects blackout rules on start, mid-term, and end boundaries", () => {
      const occurrences = expandScheduleOccurrences({
        rule: {
          type: "single",
          extraDates: ["2027-01-04", "2027-02-15", "2027-03-10", "2027-04-30"],
          localStartTime: "10:00:00",
          tzid: NEURON_TIMEZONE,
        },
        durationMinutes: 60,
        termStartDate: "2027-01-04",
        termEndDate: "2027-04-30",
        blackouts: [
          { startsOn: "2027-01-04", endsOn: "2027-01-04" },
          { startsOn: "2027-02-14", endsOn: "2027-02-16" },
        ],
      });

      expect(occurrences.map((o) => o.date)).toEqual([
        "2027-03-10",
        "2027-04-30",
      ]);
    });

    it("respects effectiveStart/effectiveEnd overrides and deduplicates dates", () => {
      const occurrences = expandScheduleOccurrences({
        rule: {
          type: "single",
          extraDates: [
            "2027-01-15",
            "2027-02-01",
            "2027-02-01",
            "2027-02-28",
            "2027-03-15",
          ],
          localStartTime: "10:00:00",
          tzid: NEURON_TIMEZONE,
        },
        durationMinutes: 60,
        effectiveStart: "2027-02-01",
        effectiveEnd: "2027-02-28",
        termStartDate: "2027-01-04",
        termEndDate: "2027-04-30",
        blackouts: [],
      });

      expect(occurrences.map((o) => o.date)).toEqual([
        "2027-02-01",
        "2027-02-28",
      ]);
    });

    it("does not emit phantom yearly occurrences across multi-year terms", () => {
      const occurrences = expandScheduleOccurrences({
        rule: {
          type: "single",
          extraDates: ["2027-02-01", "2027-03-01"],
          localStartTime: "10:00:00",
          tzid: NEURON_TIMEZONE,
        },
        durationMinutes: 60,
        termStartDate: "2027-01-04",
        termEndDate: "2029-06-30",
        blackouts: [],
      });

      expect(occurrences.map((o) => o.date)).toEqual([
        "2027-02-01",
        "2027-03-01",
      ]);
    });
  });

  describe("recurring schedules", () => {
    it("preserves weekly start and end boundaries and excludes holidays across DST", () => {
      const occurrences = expandScheduleOccurrences({
        rule: {
          type: "weekly",
          weekday: "MO",
          interval: 1,
          localStartTime: "10:00:00",
          tzid: NEURON_TIMEZONE,
        },
        durationMinutes: 60,
        termStartDate: "2027-03-08",
        termEndDate: "2027-03-29",
        blackouts: [{ startsOn: "2027-03-15", endsOn: "2027-03-15" }],
      });

      expect(occurrences.map((o) => o.date)).toEqual([
        "2027-03-08",
        "2027-03-22",
        "2027-03-29",
      ]);
      // Mar 8 is PST (UTC-8), Mar 22 & 29 are PDT (UTC-7)
      expect(occurrences[0]!.startAt).toBe("2027-03-08T18:00:00Z");
      expect(occurrences[1]!.startAt).toBe("2027-03-22T17:00:00Z");
      expect(occurrences[2]!.startAt).toBe("2027-03-29T17:00:00Z");
    });

    it("preserves monthly start and end boundaries and excludes holidays", () => {
      const occurrences = expandScheduleOccurrences({
        rule: {
          type: "monthly",
          weekday: "MO",
          nth: 1,
          localStartTime: "10:00:00",
          tzid: NEURON_TIMEZONE,
        },
        durationMinutes: 60,
        termStartDate: "2027-01-04",
        termEndDate: "2027-04-05",
        blackouts: [{ startsOn: "2027-02-01", endsOn: "2027-02-01" }],
      });

      expect(occurrences.map((o) => o.date)).toEqual([
        "2027-01-04",
        "2027-03-01",
        "2027-04-05",
      ]);
    });
  });
});
