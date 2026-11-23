import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { randomUUID } from "crypto";
import { Temporal } from "@js-temporal/polyfill";
import { course, shift, term } from "@/server/db/schema";
import { eq, inArray } from "drizzle-orm";
import { NeuronErrorCodes } from "@/server/errors/neuron-error";
import type { IClassService } from "@/server/services/entity/classService";
import type { ITermService } from "@/server/services/entity/termService";
import type { MockJobService } from "../mocks/mock-job-service";
import {
  createTestScope,
  type ITestServiceScope,
} from "../helpers/test-service-scope";

describe("TermService", () => {
  let scope: ITestServiceScope;
  let termService: ITermService;
  let createdTermIds: string[] = [];

  beforeEach(() => {
    scope = createTestScope();
    scope.mockSession.setAsAdmin();
    termService = scope.resolve<ITermService>("termService");
  });

  afterEach(async () => {
    if (createdTermIds.length > 0) {
      await scope.db.delete(term).where(inArray(term.id, createdTermIds));
      createdTermIds = [];
    }
    scope.dispose();
  });

  describe("getAllTerms", () => {
    it("should return empty array when no terms exist", async () => {
      const result = await termService.getAllTerms();

      expect(result).toEqual([]);
    });

    it("should return all terms", async () => {
      const termId = await termService.createTerm({
        name: "Fall 2024",
        startDate: "2024-09-01",
        endDate: "2024-12-15",
        holidays: [],
      });
      createdTermIds.push(termId);

      const result = await termService.getAllTerms();

      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe("Fall 2024");
    });

    it("should return the most recent terms first", async () => {
      const termInputs = [
        {
          name: "Fall 2025",
          startDate: "2025-09-01",
          endDate: "2025-12-15",
          holidays: [],
        },
        {
          name: "Spring 2026",
          startDate: "2026-05-01",
          endDate: "2026-08-15",
          holidays: [],
        },
        {
          name: "Winter 2026",
          startDate: "2026-01-01",
          endDate: "2026-04-15",
          holidays: [],
        },
      ];

      for (const input of termInputs) {
        createdTermIds.push(await termService.createTerm(input));
      }

      const result = await termService.getAllTerms();

      expect(result.map((term) => term.name)).toEqual([
        "Spring 2026",
        "Winter 2026",
        "Fall 2025",
      ]);
    });
  });

  describe("createTerm", () => {
    it("should create a term with holidays", async () => {
      const termId = await termService.createTerm({
        name: "Winter 2025",
        startDate: "2025-01-06",
        endDate: "2025-04-15",
        holidays: [{ startsOn: "2025-02-17", endsOn: "2025-02-21" }],
      });
      createdTermIds.push(termId);

      expect(termId).toBeDefined();

      const fetchedTerm = await termService.getTerm(termId);
      expect(fetchedTerm.name).toBe("Winter 2025");
      expect(fetchedTerm.holidays).toHaveLength(1);
    });
  });

  describe("deleteTerm", () => {
    it("should delete a term", async () => {
      const termId = await termService.createTerm({
        name: "To Delete",
        startDate: "2025-01-01",
        endDate: "2025-04-01",
        holidays: [],
      });

      await termService.deleteTerm(termId);

      const terms = await termService.getAllTerms();
      expect(terms).toHaveLength(0);
    });

    it("should throw when deleting non-existent term", async () => {
      await expect(termService.deleteTerm("non-existent-id")).rejects.toThrow();
    });
  });

  describe("getTerm", () => {
    it("should return a specific term by id", async () => {
      const termId = await termService.createTerm({
        name: "Spring 2025",
        startDate: "2025-03-01",
        endDate: "2025-06-15",
        holidays: [],
      });
      createdTermIds.push(termId);

      const result = await termService.getTerm(termId);

      expect(result.id).toBe(termId);
      expect(result.name).toBe("Spring 2025");
    });

    it("should throw when term not found", async () => {
      await expect(termService.getTerm("non-existent-id")).rejects.toThrow();
    });
  });

  describe("publishTerm", () => {
    it("should publish a term", async () => {
      const termId = await termService.createTerm({
        name: "Publish Test",
        startDate: "2026-01-01",
        endDate: "2026-04-01",
        holidays: [],
      });
      createdTermIds.push(termId);

      const before = await termService.getTerm(termId);
      expect(before.published).toBe(false);

      await termService.publishTerm(termId);

      const after = await termService.getTerm(termId);
      expect(after.published).toBe(true);
    });

    it("should throw when publishing non-existent term", async () => {
      await expect(
        termService.publishTerm("non-existent-id"),
      ).rejects.toThrow();
    });
  });

  describe("unpublishTerm", () => {
    it("should unpublish a published term", async () => {
      const termId = await termService.createTerm({
        name: "Unpublish Test",
        startDate: "2026-01-01",
        endDate: "2026-04-01",
        holidays: [],
      });
      createdTermIds.push(termId);

      await termService.publishTerm(termId);
      await termService.unpublishTerm(termId);

      const result = await termService.getTerm(termId);
      expect(result.published).toBe(false);
    });
  });

  describe("published visibility", () => {
    it("should default new terms to unpublished", async () => {
      const termId = await termService.createTerm({
        name: "Default Unpublished",
        startDate: "2026-01-01",
        endDate: "2026-04-01",
        holidays: [],
      });
      createdTermIds.push(termId);

      const result = await termService.getTerm(termId);
      expect(result.published).toBe(false);
    });

    it("admin should see unpublished terms in getAllTerms", async () => {
      const termId = await termService.createTerm({
        name: "Admin Visible",
        startDate: "2026-01-01",
        endDate: "2026-04-01",
        holidays: [],
      });
      createdTermIds.push(termId);

      const result = await termService.getAllTerms();
      expect(result.some((t) => t.id === termId)).toBe(true);
    });

    it("volunteer should not see unpublished terms in getAllTerms", async () => {
      const termId = await termService.createTerm({
        name: "Volunteer Hidden",
        startDate: "2026-01-01",
        endDate: "2026-04-01",
        holidays: [],
      });
      createdTermIds.push(termId);

      scope.mockSession.setAsVolunteer();

      const result = await termService.getAllTerms();
      expect(result.some((t) => t.id === termId)).toBe(false);
    });

    it("volunteer should see published terms in getAllTerms", async () => {
      const termId = await termService.createTerm({
        name: "Volunteer Visible",
        startDate: "2026-01-01",
        endDate: "2026-04-01",
        holidays: [],
      });
      createdTermIds.push(termId);
      await termService.publishTerm(termId);

      scope.mockSession.setAsVolunteer();

      const result = await termService.getAllTerms();
      expect(result.some((t) => t.id === termId)).toBe(true);
    });

    it("volunteer should not see unpublished term via getTerm", async () => {
      const termId = await termService.createTerm({
        name: "Hidden by ID",
        startDate: "2026-01-01",
        endDate: "2026-04-01",
        holidays: [],
      });
      createdTermIds.push(termId);

      scope.mockSession.setAsVolunteer();

      await expect(termService.getTerm(termId)).rejects.toThrow();
    });

    it("volunteer getCurrentTerm should skip unpublished terms", async () => {
      const unpublishedId = await termService.createTerm({
        name: "Unpublished Current",
        startDate: "2020-01-01",
        endDate: "2030-12-31",
        holidays: [],
      });
      createdTermIds.push(unpublishedId);

      const publishedId = await termService.createTerm({
        name: "Published Past",
        startDate: "2020-01-01",
        endDate: "2020-06-30",
        holidays: [],
      });
      createdTermIds.push(publishedId);
      await termService.publishTerm(publishedId);

      scope.mockSession.setAsVolunteer();

      const current = await termService.getCurrentTerm();
      expect(current?.id).not.toBe(unpublishedId);
      if (current) {
        expect(current.published).toBe(true);
      }
    });
  });

  describe("holiday transaction atomicity and ownership", () => {
    it("awaits holiday insertion and rolls back term creation when a holiday is invalid", async () => {
      const uniqueName = `Invalid Holiday Term ${randomUUID()}`;

      await expect(
        termService.createTerm({
          name: uniqueName,
          startDate: "2027-01-01",
          endDate: "2027-04-30",
          // Violates chk_blackout_range_valid (endsOn < startsOn)
          holidays: [{ startsOn: "2027-02-20", endsOn: "2027-02-15" }],
        }),
      ).rejects.toThrow();

      // Transaction must have rolled back so no orphaned term row was committed.
      const matchingTerms = await scope.db
        .select()
        .from(term)
        .where(eq(term.name, uniqueName));
      expect(matchingTerms).toHaveLength(0);
    });

    it("rejects cross-term holiday IDs in updatedHolidays and deletedHolidays", async () => {
      const termAId = await termService.createTerm({
        name: `Term A ${randomUUID()}`,
        startDate: "2027-01-01",
        endDate: "2027-04-30",
        holidays: [{ startsOn: "2027-02-10", endsOn: "2027-02-10" }],
      });
      const termBId = await termService.createTerm({
        name: `Term B ${randomUUID()}`,
        startDate: "2027-05-01",
        endDate: "2027-08-31",
        holidays: [{ startsOn: "2027-07-01", endsOn: "2027-07-01" }],
      });
      createdTermIds.push(termAId, termBId);

      const termB = await termService.getTerm(termBId);
      const termBHolidayId = termB.holidays[0]!.id;

      await expect(
        termService.updateTerm({
          id: termAId,
          name: "Term A Renamed",
          addedHolidays: [],
          updatedHolidays: [
            {
              id: termBHolidayId,
              startsOn: "2027-07-02",
              endsOn: "2027-07-02",
            },
          ],
          deletedHolidays: [],
        }),
      ).rejects.toMatchObject({ code: NeuronErrorCodes.BAD_REQUEST });

      await expect(
        termService.updateTerm({
          id: termAId,
          name: "Term A Renamed",
          addedHolidays: [],
          updatedHolidays: [],
          deletedHolidays: [termBHolidayId],
        }),
      ).rejects.toMatchObject({ code: NeuronErrorCodes.BAD_REQUEST });

      const termBAfter = await termService.getTerm(termBId);
      expect(termBAfter.holidays).toHaveLength(1);
      expect(termBAfter.holidays[0]!.startsOn).toBe("2027-07-01");
    });
  });

  describe("term date and holiday edits around class publication", () => {
    async function createTermWithClass(opts?: {
      holidays?: { startsOn: string; endsOn: string }[];
      publishClass?: boolean;
    }) {
      const classService = scope.resolve<IClassService>("classService");
      const termId = await termService.createTerm({
        name: `Published Policy Term ${randomUUID()}`,
        startDate: "2027-06-01",
        endDate: "2027-06-30",
        holidays: opts?.holidays ?? [],
      });
      createdTermIds.push(termId);

      const classId = await classService.createClass({
        termId,
        name: `Term Policy Class ${randomUUID()}`,
        lowerLevel: 1,
        upperLevel: 2,
        category: "literacy",
        schedules: [
          {
            localStartTime: Temporal.PlainTime.from("10:00:00"),
            localEndTime: Temporal.PlainTime.from("11:00:00"),
            volunteerUserIds: [],
            preferredVolunteerCount: 1,
            instructorUserIds: [],
            rule: {
              type: "weekly",
              weekday: "MO",
              interval: 1,
            },
          },
        ],
      });

      if (opts?.publishClass) {
        await classService.publishClass(classId);
      }

      return { termId, classId, classService };
    }

    it("allows editing term dates and holidays before publication and applies them when published", async () => {
      const { termId, classId, classService } = await createTermWithClass({
        publishClass: false,
      });

      // Mondays in June 2027: 2027-06-07, 2027-06-14, 2027-06-21, 2027-06-28.
      // Exclude 2027-06-14 via holiday and shorten term endDate to 2027-06-22.
      await termService.updateTerm({
        id: termId,
        name: "Updated Before Publish",
        startDate: "2027-06-01",
        endDate: "2027-06-22",
        addedHolidays: [{ startsOn: "2027-06-14", endsOn: "2027-06-14" }],
        updatedHolidays: [],
        deletedHolidays: [],
      });

      await classService.publishClass(classId);

      const generatedShifts = await scope.db
        .select()
        .from(shift)
        .where(eq(shift.courseId, classId));
      expect(generatedShifts.map((s) => s.date).sort()).toEqual([
        "2027-06-07",
        "2027-06-21",
      ]);
    });

    it("rejects adding holidays or changing dates after a class in the term is published while preserving shifts and pending jobs", async () => {
      const mockJobService = scope.resolve<MockJobService>("jobService");
      const { termId, classId } = await createTermWithClass({
        holidays: [{ startsOn: "2027-06-28", endsOn: "2027-06-28" }],
        publishClass: true,
      });

      const originalTerm = await termService.getTerm(termId);
      const existingHolidayId = originalTerm.holidays[0]!.id;
      const shiftsBefore = await scope.db
        .select()
        .from(shift)
        .where(eq(shift.courseId, classId));
      // Mondays 2027-06-07, 2027-06-14, 2027-06-21 (2027-06-28 excluded by holiday)
      expect(shiftsBefore.map((s) => s.date).sort()).toEqual([
        "2027-06-07",
        "2027-06-14",
        "2027-06-21",
      ]);
      const jobCallsBefore = mockJobService.calls.length;
      expect(jobCallsBefore).toBe(shiftsBefore.length * 2);

      // Adding a holiday after publication must be rejected.
      await expect(
        termService.updateTerm({
          id: termId,
          name: originalTerm.name,
          startDate: originalTerm.startDate,
          endDate: originalTerm.endDate,
          addedHolidays: [{ startsOn: "2027-06-14", endsOn: "2027-06-14" }],
          updatedHolidays: [],
          deletedHolidays: [],
        }),
      ).rejects.toMatchObject({ code: NeuronErrorCodes.BAD_REQUEST });

      // Updating an existing holiday after publication must be rejected.
      await expect(
        termService.updateTerm({
          id: termId,
          name: originalTerm.name,
          addedHolidays: [],
          updatedHolidays: [
            {
              id: existingHolidayId,
              startsOn: "2027-06-21",
              endsOn: "2027-06-21",
            },
          ],
          deletedHolidays: [],
        }),
      ).rejects.toMatchObject({ code: NeuronErrorCodes.BAD_REQUEST });

      // Deleting an existing holiday after publication must be rejected.
      await expect(
        termService.updateTerm({
          id: termId,
          name: originalTerm.name,
          addedHolidays: [],
          updatedHolidays: [],
          deletedHolidays: [existingHolidayId],
        }),
      ).rejects.toMatchObject({ code: NeuronErrorCodes.BAD_REQUEST });

      // Changing term startDate or endDate after publication must be rejected.
      await expect(
        termService.updateTerm({
          id: termId,
          name: originalTerm.name,
          startDate: "2027-06-10",
          endDate: originalTerm.endDate,
          addedHolidays: [],
          updatedHolidays: [],
          deletedHolidays: [],
        }),
      ).rejects.toMatchObject({ code: NeuronErrorCodes.BAD_REQUEST });

      await expect(
        termService.updateTerm({
          id: termId,
          name: originalTerm.name,
          startDate: originalTerm.startDate,
          endDate: "2027-07-15",
          addedHolidays: [],
          updatedHolidays: [],
          deletedHolidays: [],
        }),
      ).rejects.toMatchObject({ code: NeuronErrorCodes.BAD_REQUEST });

      // Existing holidays, generated shifts, and pending notification jobs remain untouched.
      const termAfterRejects = await termService.getTerm(termId);
      expect(termAfterRejects.holidays).toHaveLength(1);
      expect(termAfterRejects.holidays[0]!.startsOn).toBe("2027-06-28");

      const shiftsAfter = await scope.db
        .select()
        .from(shift)
        .where(eq(shift.courseId, classId));
      expect(shiftsAfter.map((s) => s.id).sort()).toEqual(
        shiftsBefore.map((s) => s.id).sort(),
      );
      expect(mockJobService.calls).toHaveLength(jobCallsBefore);

      // Metadata-only rename (even when passing unchanged startDate/endDate, matching TermFormDialog) succeeds.
      await termService.updateTerm({
        id: termId,
        name: "Renamed Published Term",
        startDate: originalTerm.startDate,
        endDate: originalTerm.endDate,
        addedHolidays: [],
        updatedHolidays: [],
        deletedHolidays: [],
      });

      const renamedTerm = await termService.getTerm(termId);
      expect(renamedTerm.name).toBe("Renamed Published Term");
      expect(renamedTerm.startDate).toBe(originalTerm.startDate);
      expect(renamedTerm.endDate).toBe(originalTerm.endDate);

      // Verify course cleanup cascade works cleanly via term delete in afterEach.
      const courses = await scope.db
        .select()
        .from(course)
        .where(eq(course.termId, termId));
      expect(courses).toHaveLength(1);
    });
  });
});
