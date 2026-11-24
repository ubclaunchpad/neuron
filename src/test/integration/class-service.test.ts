import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { randomUUID } from "crypto";
import { Temporal } from "@js-temporal/polyfill";
import { user, volunteer, term, course } from "@/server/db/schema";
import { inArray } from "drizzle-orm";
import type { IClassService } from "@/server/services/entity/classService";
import type { ITermService } from "@/server/services/entity/termService";
import {
  createTestScope,
  type ITestServiceScope,
} from "../helpers/test-service-scope";

describe("ClassService", () => {
  let scope: ITestServiceScope;
  let termService: ITermService;
  let classService: IClassService;

  let createdUserIds: string[] = [];
  let createdTermIds: string[] = [];
  let createdClassIds: string[] = [];

  let volunteerId: string;
  let instructorId: string;

  beforeEach(() => {
    scope = createTestScope();
    scope.mockSession.setAsAdmin();
    termService = scope.resolve<ITermService>("termService");
    classService = scope.resolve<IClassService>("classService");
  });

  beforeEach(async () => {
    volunteerId = randomUUID();
    instructorId = randomUUID();

    await scope.db.insert(user).values([
      {
        id: volunteerId,
        name: "Vol",
        lastName: "One",
        email: `vol-${Date.now()}-${randomUUID()}@test.com`,
        role: "volunteer",
        status: "active",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: instructorId,
        name: "Inst",
        lastName: "One",
        email: `inst-${Date.now()}-${randomUUID()}@test.com`,
        role: "instructor",
        status: "active",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    createdUserIds.push(volunteerId, instructorId);

    await scope.db.insert(volunteer).values([{ userId: volunteerId }]);
  });

  afterEach(async () => {
    if (createdClassIds.length > 0) {
      await scope.db.delete(course).where(inArray(course.id, createdClassIds));
      createdClassIds = [];
    }
    if (createdTermIds.length > 0) {
      await scope.db.delete(term).where(inArray(term.id, createdTermIds));
      createdTermIds = [];
    }
    if (createdUserIds.length > 0) {
      await scope.db.delete(user).where(inArray(user.id, createdUserIds));
      createdUserIds = [];
    }
    scope.dispose();
  });

  async function createTermAndClass(opts?: { publishTerm?: boolean }) {
    const termId = await termService.createTerm({
      name: `Test Term ${randomUUID()}`,
      startDate: "2026-06-01",
      endDate: "2026-08-31",
      holidays: [],
    });
    createdTermIds.push(termId);

    if (opts?.publishTerm) {
      await termService.publishTerm(termId);
    }

    const classId = await classService.createClass({
      termId,
      name: `Test Class ${randomUUID()}`,
      lowerLevel: 1,
      upperLevel: 2,
      category: "literacy",
      schedules: [
        {
          localStartTime: Temporal.PlainTime.from("10:00:00"),
          localEndTime: Temporal.PlainTime.from("11:00:00"),
          volunteerUserIds: [volunteerId],
          preferredVolunteerCount: 1,
          instructorUserIds: [instructorId],
          rule: {
            type: "single",
            extraDates: ["2026-07-15"],
          },
        },
      ],
    });
    createdClassIds.push(classId);

    return { termId, classId };
  }

  describe("class creation", () => {
    it("should allow creating a non-exercise class without levels", async () => {
      const termId = await termService.createTerm({
        name: `Test Term ${randomUUID()}`,
        startDate: "2026-06-01",
        endDate: "2026-08-31",
        holidays: [],
      });
      createdTermIds.push(termId);

      const classId = await classService.createClass({
        termId,
        name: `Non-Exercise Class ${randomUUID()}`,
        lowerLevel: null,
        upperLevel: null,
        category: "Literacy",
        schedules: [],
      });
      createdClassIds.push(classId);

      const result = await classService.getClass(classId);
      expect(result.id).toBe(classId);
      expect(result.lowerLevel).toBeNull();
      expect(result.upperLevel).toBeNull();
    });
  });

  describe("term published visibility", () => {
    it("admin should see classes in unpublished terms via getClass", async () => {
      const { classId } = await createTermAndClass({ publishTerm: false });

      const result = await classService.getClass(classId);
      expect(result.id).toBe(classId);
    });

    it("volunteer should not see classes in unpublished terms via getClass", async () => {
      const { classId } = await createTermAndClass({ publishTerm: false });

      scope.mockSession.setAsVolunteer();

      await expect(classService.getClass(classId)).rejects.toThrow();
    });

    it("volunteer should see classes in published terms via getClass", async () => {
      const { classId } = await createTermAndClass({ publishTerm: true });

      scope.mockSession.setAsVolunteer();

      const result = await classService.getClass(classId);
      expect(result.id).toBe(classId);
    });

    it("admin should see classes in unpublished terms via getClassesForRequest", async () => {
      const { termId } = await createTermAndClass({ publishTerm: false });

      const result = await classService.getClassesForRequest({ term: termId });
      expect(result.classes.length).toBeGreaterThanOrEqual(1);
    });

    it("volunteer should not see unpublished terms via getClassesForRequest", async () => {
      const { termId } = await createTermAndClass({ publishTerm: false });

      scope.mockSession.setAsVolunteer();

      await expect(
        classService.getClassesForRequest({ term: termId }),
      ).rejects.toThrow();
    });

    it("volunteer should see published terms via getClassesForRequest", async () => {
      const { termId } = await createTermAndClass({ publishTerm: true });

      scope.mockSession.setAsVolunteer();

      const result = await classService.getClassesForRequest({
        term: termId,
      });
      expect(result.classes.length).toBeGreaterThanOrEqual(1);
    });

    it("volunteer should not see classes from unpublished terms in getClassesForSelect", async () => {
      const { classId } = await createTermAndClass({ publishTerm: false });

      scope.mockSession.setAsVolunteer();

      const result = await classService.getClassesForSelect();
      expect(result.some((c) => c.id === classId)).toBe(false);
    });

    it("volunteer should see classes from published terms in getClassesForSelect", async () => {
      const { classId } = await createTermAndClass({ publishTerm: true });

      scope.mockSession.setAsVolunteer();

      const result = await classService.getClassesForSelect();
      expect(result.some((c) => c.id === classId)).toBe(true);
    });

    it("volunteer should not see classes from unpublished terms via getClasses", async () => {
      const { classId } = await createTermAndClass({ publishTerm: false });

      scope.mockSession.setAsVolunteer();

      await expect(classService.getClasses([classId])).rejects.toThrow();
    });
  });

  describe("schedule updates and empty array guards", () => {
    it("preserves each schedule's own rule when updating multiple schedules in reverse order", async () => {
      const termId = await termService.createTerm({
        name: `Multi Schedule Term ${randomUUID()}`,
        startDate: "2026-06-01",
        endDate: "2026-08-31",
        holidays: [],
      });
      createdTermIds.push(termId);

      const classId = await classService.createClass({
        termId,
        name: `Multi Schedule Class ${randomUUID()}`,
        lowerLevel: 1,
        upperLevel: 2,
        category: "literacy",
        schedules: [
          {
            localStartTime: Temporal.PlainTime.from("09:00:00"),
            localEndTime: Temporal.PlainTime.from("10:00:00"),
            volunteerUserIds: [],
            preferredVolunteerCount: 1,
            instructorUserIds: [],
            rule: { type: "weekly", weekday: "MO", interval: 1 },
          },
          {
            localStartTime: Temporal.PlainTime.from("14:00:00"),
            localEndTime: Temporal.PlainTime.from("16:00:00"),
            volunteerUserIds: [],
            preferredVolunteerCount: 2,
            instructorUserIds: [],
            rule: { type: "weekly", weekday: "FR", interval: 1 },
          },
        ],
      });
      createdClassIds.push(classId);

      const created = await classService.getClass(classId);
      const monSchedule = created.schedules.find(
        (s) => s.rule.type === "weekly" && s.rule.weekday === "MO",
      )!;
      const friSchedule = created.schedules.find(
        (s) => s.rule.type === "weekly" && s.rule.weekday === "FR",
      )!;

      // Update in reversed order so array index != DB return order
      await classService.updateClass({
        id: classId,
        addedSchedules: [],
        deletedSchedules: [],
        updatedSchedules: [
          {
            id: friSchedule.id,
            preferredVolunteerCount: 3,
            addedVolunteerUserIds: [],
            removedVolunteerUserIds: [],
            addedInstructorUserIds: [],
            removedInstructorUserIds: [],
          },
          {
            id: monSchedule.id,
            preferredVolunteerCount: 4,
            addedVolunteerUserIds: [],
            removedVolunteerUserIds: [],
            addedInstructorUserIds: [],
            removedInstructorUserIds: [],
          },
        ],
      });

      const updated = await classService.getClass(classId);
      const updatedMon = updated.schedules.find(
        (s) => s.id === monSchedule.id,
      )!;
      const updatedFri = updated.schedules.find(
        (s) => s.id === friSchedule.id,
      )!;

      expect(updatedMon.rule).toMatchObject({ type: "weekly", weekday: "MO" });
      expect(updatedMon.durationMinutes).toBe(60);
      expect(updatedMon.preferredVolunteerCount).toBe(4);

      expect(updatedFri.rule).toMatchObject({ type: "weekly", weekday: "FR" });
      expect(updatedFri.durationMinutes).toBe(120);
      expect(updatedFri.preferredVolunteerCount).toBe(3);
    });

    it("returns an empty array for getClasses([])", async () => {
      await expect(classService.getClasses([])).resolves.toEqual([]);
    });
  });
});
