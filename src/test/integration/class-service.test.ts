import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { randomUUID } from "crypto";
import { Temporal } from "@js-temporal/polyfill";
import {
  user,
  volunteer,
  term,
  course,
  deliveryOutbox,
} from "@/server/db/schema";
import { eq, inArray } from "drizzle-orm";
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
    await scope.db
      .delete(deliveryOutbox)
      .where(eq(deliveryOutbox.kind, "schedule-assignment"));
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

    it("does not queue assignment changes for an unpublished class", async () => {
      const { classId } = await createTermAndClass();
      const classData = await classService.getClass(classId);
      const scheduleId = classData.schedules[0]!.id;

      await classService.updateClass({
        id: classId,
        addedSchedules: [],
        deletedSchedules: [],
        updatedSchedules: [
          {
            id: scheduleId,
            addedVolunteerUserIds: [],
            removedVolunteerUserIds: [volunteerId],
            addedInstructorUserIds: [],
            removedInstructorUserIds: [],
          },
        ],
      });

      expect(
        await scope.db
          .select()
          .from(deliveryOutbox)
          .where(eq(deliveryOutbox.kind, "schedule-assignment")),
      ).toHaveLength(0);
    });

    it("records only newly inserted schedule assignments", async () => {
      const { classId } = await createTermAndClass({ publishTerm: true });
      const classData = await classService.getClass(classId);
      const scheduleId = classData.schedules[0]!.id;
      const addedVolunteerId = randomUUID();
      createdUserIds.push(addedVolunteerId);

      await scope.db.insert(user).values({
        id: addedVolunteerId,
        name: "Vol",
        lastName: "Two",
        email: `vol-${randomUUID()}@test.com`,
        role: "volunteer",
        status: "active",
        emailVerified: true,
      });
      await scope.db.insert(volunteer).values({ userId: addedVolunteerId });
      await classService.publishClass(classId);

      const update = {
        id: classId,
        addedSchedules: [],
        deletedSchedules: [],
        updatedSchedules: [
          {
            id: scheduleId,
            addedVolunteerUserIds: [addedVolunteerId],
            removedVolunteerUserIds: [],
            addedInstructorUserIds: [],
            removedInstructorUserIds: [],
          },
        ],
      };

      await classService.updateClass(update);

      const intents = () =>
        scope.db
          .select()
          .from(deliveryOutbox)
          .where(
            eq(
              deliveryOutbox.deliveryKey,
              `schedule-assignment:${scheduleId}:${addedVolunteerId}`,
            ),
          );
      expect(await intents()).toHaveLength(1);
      expect((await intents())[0]?.payload).toMatchObject({
        scheduleId,
        volunteerUserId: addedVolunteerId,
        change: "added",
      });

      const originalRevision = (await intents())[0]!.revisionId;
      await classService.updateClass(update);
      expect((await intents())[0]!.revisionId).toBe(originalRevision);
      expect(await intents()).toHaveLength(1);

      await classService.updateClass({
        id: classId,
        addedSchedules: [],
        deletedSchedules: [],
        updatedSchedules: [
          {
            id: scheduleId,
            addedVolunteerUserIds: [],
            removedVolunteerUserIds: [addedVolunteerId],
            addedInstructorUserIds: [],
            removedInstructorUserIds: [],
          },
        ],
      });
      expect(await intents()).toHaveLength(1);
      expect((await intents())[0]?.payload).toMatchObject({
        scheduleId,
        volunteerUserId: addedVolunteerId,
        change: "removed",
      });

      await classService.updateClass(update);
      expect(await intents()).toHaveLength(1);
      expect((await intents())[0]?.payload).toMatchObject({
        scheduleId,
        volunteerUserId: addedVolunteerId,
        change: "added",
      });
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
});
