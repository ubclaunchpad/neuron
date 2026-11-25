import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { asValue } from "awilix";
import { randomUUID } from "crypto";
import { Temporal } from "@js-temporal/polyfill";
import { user, volunteer, term, course } from "@/server/db/schema";
import { eq, inArray, sql } from "drizzle-orm";
import { env } from "@/env";
import type { IClassService } from "@/server/services/entity/classService";
import type { ITermService } from "@/server/services/entity/termService";
import { JobService, type IJobService } from "@/server/services/jobService";
import {
  DELETE_IMAGE_JOB_NAME,
  deleteImageJob,
} from "@/server/jobs/definitions/delete-image.job";
import { jobsByName } from "@/server/jobs/registry";
import type { MockImageService } from "../mocks/mock-image-service";
import type { MockJobService } from "../mocks/mock-job-service";
import {
  createTestScope,
  type ITestServiceScope,
} from "../helpers/test-service-scope";

describe("ClassService", () => {
  let scope: ITestServiceScope;
  let termService: ITermService;
  let classService: IClassService;
  let mockImageService: MockImageService;
  let mockJobService: MockJobService;

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
    mockImageService = scope.resolve<MockImageService>("imageService");
    mockJobService = scope.resolve<MockJobService>("jobService");
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
    vi.restoreAllMocks();
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

  async function createTermAndClass(opts?: {
    publishTerm?: boolean;
    image?: string;
  }) {
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
      image: opts?.image,
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

  describe("transactional image cleanup", () => {
    it("preserves the previous image when later published-class recurrence validation fails", async () => {
      const oldImageKey = `old-${randomUUID()}.webp`;
      const newImageKey = `new-${randomUUID()}.webp`;
      mockImageService.simulateUpload(oldImageKey);
      mockImageService.simulateUpload(newImageKey);

      const { classId } = await createTermAndClass({ image: oldImageKey });
      await classService.publishClass(classId);

      const deleteSpy = vi.spyOn(mockImageService, "deleteImage");

      await expect(
        classService.updateClass({
          id: classId,
          image: newImageKey,
          addedSchedules: [
            {
              localStartTime: Temporal.PlainTime.from("12:00:00"),
              localEndTime: Temporal.PlainTime.from("13:00:00"),
              volunteerUserIds: [volunteerId],
              preferredVolunteerCount: 1,
              instructorUserIds: [instructorId],
              rule: {
                type: "single",
                extraDates: ["2026-07-20"],
              },
            },
          ],
          updatedSchedules: [],
          deletedSchedules: [],
        }),
      ).rejects.toThrow("Schedules recurrances can not be changed");

      const updatedClass = await classService.getClass(classId);
      expect(updatedClass.image).toBe(oldImageKey);
      expect(deleteSpy).not.toHaveBeenCalled();
      expect(mockImageService.storedImages.has(oldImageKey)).toBe(true);
      expect(mockJobService.calls).toHaveLength(0);
    });

    it("preserves the previous image when later schedule role validation fails and rolls back", async () => {
      const oldImageKey = `old-${randomUUID()}.webp`;
      const newImageKey = `new-${randomUUID()}.webp`;
      mockImageService.simulateUpload(oldImageKey);
      mockImageService.simulateUpload(newImageKey);

      const { classId } = await createTermAndClass({ image: oldImageKey });
      const deleteSpy = vi.spyOn(mockImageService, "deleteImage");

      await expect(
        classService.updateClass({
          id: classId,
          image: newImageKey,
          addedSchedules: [
            {
              localStartTime: Temporal.PlainTime.from("12:00:00"),
              localEndTime: Temporal.PlainTime.from("13:00:00"),
              volunteerUserIds: [instructorId],
              preferredVolunteerCount: 1,
              instructorUserIds: [instructorId],
              rule: {
                type: "single",
                extraDates: ["2026-07-20"],
              },
            },
          ],
          updatedSchedules: [],
          deletedSchedules: [],
        }),
      ).rejects.toThrow("All assigned volunteers must have the volunteer role");

      const updatedClass = await classService.getClass(classId);
      expect(updatedClass.image).toBe(oldImageKey);
      expect(deleteSpy).not.toHaveBeenCalled();
      expect(mockImageService.storedImages.has(oldImageKey)).toBe(true);
      expect(mockJobService.calls).toHaveLength(0);
    });

    it("never schedules deletion for same-key, omitted, undefined, or initial-attach updates", async () => {
      const imageKey = `keep-${randomUUID()}.webp`;
      mockImageService.simulateUpload(imageKey);

      const { classId } = await createTermAndClass();
      const deleteSpy = vi.spyOn(mockImageService, "deleteImage");
      const startSpy = vi.spyOn(mockJobService, "start");

      // Non-image update should not bootstrap jobService
      await classService.updateClass({
        id: classId,
        name: "Name Only Update",
        addedSchedules: [],
        updatedSchedules: [],
        deletedSchedules: [],
      });
      expect(startSpy).not.toHaveBeenCalled();

      // Attaching initial image (null -> key) should not schedule deletion
      await classService.updateClass({
        id: classId,
        image: imageKey,
        addedSchedules: [],
        updatedSchedules: [],
        deletedSchedules: [],
      });

      // Same-key and explicit undefined updates should not schedule deletion
      await classService.updateClass({
        id: classId,
        name: "Renamed Class",
        image: imageKey,
        addedSchedules: [],
        updatedSchedules: [],
        deletedSchedules: [],
      });
      await classService.updateClass({
        id: classId,
        image: undefined,
        addedSchedules: [],
        updatedSchedules: [],
        deletedSchedules: [],
      });

      const updatedClass = await classService.getClass(classId);
      expect(updatedClass.name).toBe("Renamed Class");
      expect(updatedClass.image).toBe(imageKey);
      expect(deleteSpy).not.toHaveBeenCalled();
      expect(mockImageService.storedImages.has(imageKey)).toBe(true);
      expect(mockJobService.calls).toHaveLength(0);
    });

    it("enqueues transactional cleanup on replacement and null-clear, and deletes when job runs", async () => {
      const oldImageKey = `old-${randomUUID()}.webp`;
      const newImageKey = `new-${randomUUID()}.webp`;
      mockImageService.simulateUpload(oldImageKey);
      mockImageService.simulateUpload(newImageKey);

      const { classId } = await createTermAndClass({ image: oldImageKey });
      const deleteSpy = vi.spyOn(mockImageService, "deleteImage");

      await classService.updateClass({
        id: classId,
        image: newImageKey,
        addedSchedules: [],
        updatedSchedules: [],
        deletedSchedules: [],
      });

      expect((await classService.getClass(classId)).image).toBe(newImageKey);
      expect(deleteSpy).not.toHaveBeenCalled();
      expect(mockJobService.calls).toEqual([
        {
          jobName: DELETE_IMAGE_JOB_NAME,
          data: { imageKey: oldImageKey },
          options: { transaction: expect.anything() },
        },
      ]);

      await deleteImageJob.handler(
        { imageKey: oldImageKey },
        { container: scope.container, cradle: scope.container.cradle },
      );
      expect(mockImageService.storedImages.has(oldImageKey)).toBe(false);
      expect(mockImageService.storedImages.has(newImageKey)).toBe(true);

      // Clearing to null schedules deletion of newImageKey
      await classService.updateClass({
        id: classId,
        image: null,
        addedSchedules: [],
        updatedSchedules: [],
        deletedSchedules: [],
      });
      const [dbRow] = await scope.db
        .select({ image: course.image })
        .from(course)
        .where(eq(course.id, classId));
      expect(dbRow?.image).toBeNull();
      expect(mockJobService.calls[1]).toEqual({
        jobName: DELETE_IMAGE_JOB_NAME,
        data: { imageKey: newImageKey },
        options: { transaction: expect.anything() },
      });

      await deleteImageJob.handler(
        { imageKey: newImageKey },
        { container: scope.container, cradle: scope.container.cradle },
      );
      expect(mockImageService.storedImages.has(newImageKey)).toBe(false);
    });

    it("preserves exact object keys with leading or trailing whitespace during lookup and deletion", async () => {
      const spacedImageKey = `spaced-${randomUUID()}.webp `;
      mockImageService.simulateUpload(spacedImageKey);

      const deleteSpy = vi.spyOn(mockImageService, "deleteImage");
      await deleteImageJob.handler(
        { imageKey: spacedImageKey },
        { container: scope.container, cradle: scope.container.cradle },
      );

      expect(deleteSpy).toHaveBeenCalledTimes(1);
      expect(deleteSpy).toHaveBeenCalledWith(spacedImageKey);
      expect(mockImageService.storedImages.has(spacedImageKey)).toBe(false);
    });

    it("skips deletion in cleanup job when image key is still referenced by a class or user", async () => {
      const courseImageKey = `shared-course-${randomUUID()}.webp`;
      const userImageKey = `shared-user-${randomUUID()}.webp`;
      mockImageService.simulateUpload(courseImageKey);
      mockImageService.simulateUpload(userImageKey);

      await createTermAndClass({ image: courseImageKey });
      await scope.db
        .update(user)
        .set({ image: userImageKey })
        .where(eq(user.id, volunteerId));

      const deleteSpy = vi.spyOn(mockImageService, "deleteImage");

      await deleteImageJob.handler(
        { imageKey: courseImageKey },
        { container: scope.container, cradle: scope.container.cradle },
      );
      await deleteImageJob.handler(
        { imageKey: userImageKey },
        { container: scope.container, cradle: scope.container.cradle },
      );

      expect(deleteSpy).not.toHaveBeenCalled();
      expect(mockImageService.storedImages.has(courseImageKey)).toBe(true);
      expect(mockImageService.storedImages.has(userImageKey)).toBe(true);
    });

    it("enqueues cleanup on deleteClass only when an image exists and rolls back on enqueue failure", async () => {
      const imageKey = `deleted-class-${randomUUID()}.webp`;
      mockImageService.simulateUpload(imageKey);

      const { classId: classWithImage } = await createTermAndClass({
        image: imageKey,
      });
      const { classId: classWithoutImage } = await createTermAndClass();

      await classService.deleteClass(classWithoutImage);
      createdClassIds = createdClassIds.filter(
        (id) => id !== classWithoutImage,
      );
      expect(mockJobService.calls).toHaveLength(0);

      // Failed enqueue rolls back the deletion
      vi.spyOn(mockJobService, "run").mockRejectedValueOnce(
        new Error("pg-boss enqueue failed"),
      );
      await expect(classService.deleteClass(classWithImage)).rejects.toThrow(
        "pg-boss enqueue failed",
      );
      expect((await classService.getClass(classWithImage)).image).toBe(
        imageKey,
      );

      await classService.deleteClass(classWithImage);
      createdClassIds = createdClassIds.filter((id) => id !== classWithImage);
      expect(mockJobService.calls).toEqual([
        {
          jobName: DELETE_IMAGE_JOB_NAME,
          data: { imageKey },
          options: { transaction: expect.anything() },
        },
      ]);
    });

    it("rolls back updateClass if transactional cleanup enqueue fails", async () => {
      const oldImageKey = `enqueue-fail-old-${randomUUID()}.webp`;
      const newImageKey = `enqueue-fail-new-${randomUUID()}.webp`;
      mockImageService.simulateUpload(oldImageKey);
      mockImageService.simulateUpload(newImageKey);

      const { classId } = await createTermAndClass({ image: oldImageKey });
      vi.spyOn(mockJobService, "run").mockRejectedValueOnce(
        new Error("pg-boss enqueue failed"),
      );

      await expect(
        classService.updateClass({
          id: classId,
          image: newImageKey,
          addedSchedules: [],
          updatedSchedules: [],
          deletedSchedules: [],
        }),
      ).rejects.toThrow("pg-boss enqueue failed");

      expect((await classService.getClass(classId)).image).toBe(oldImageKey);
      expect(mockImageService.storedImages.has(oldImageKey)).toBe(true);
    });

    it("propagates storage failures from the retryable job and recovers on retry", async () => {
      const oldImageKey = `retry-old-${randomUUID()}.webp`;
      const newImageKey = `retry-new-${randomUUID()}.webp`;
      mockImageService.simulateUpload(oldImageKey);
      mockImageService.simulateUpload(newImageKey);

      const { classId } = await createTermAndClass({ image: oldImageKey });
      await classService.updateClass({
        id: classId,
        image: newImageKey,
        addedSchedules: [],
        updatedSchedules: [],
        deletedSchedules: [],
      });

      const registeredJob = jobsByName.get(DELETE_IMAGE_JOB_NAME);
      expect(registeredJob?.retryOpts?.retryLimit).toBeGreaterThan(0);
      expect(registeredJob?.retryOpts?.retryBackoff).toBe(true);

      const deleteSpy = vi
        .spyOn(mockImageService, "deleteImage")
        .mockRejectedValueOnce(new Error("MinIO temporarily unavailable"));

      await expect(
        deleteImageJob.handler(
          { imageKey: oldImageKey },
          { container: scope.container, cradle: scope.container.cradle },
        ),
      ).rejects.toThrow("MinIO temporarily unavailable");
      expect(mockImageService.storedImages.has(oldImageKey)).toBe(true);

      await expect(
        deleteImageJob.handler(
          { imageKey: oldImageKey },
          { container: scope.container, cradle: scope.container.cradle },
        ),
      ).resolves.toBeUndefined();
      expect(deleteSpy).toHaveBeenCalledTimes(2);
      expect(mockImageService.storedImages.has(oldImageKey)).toBe(false);
      expect(mockImageService.storedImages.has(newImageKey)).toBe(true);
    });

    it("executes superseded image deletion end-to-end through real pg-boss after commit and suppresses on rollback", async () => {
      const e2eScope = scope.container.createScope();
      const realJobService = new JobService({
        container: e2eScope,
        env: { ...env, NODE_ENV: "development" as const },
      });
      e2eScope.register({
        jobService: asValue<IJobService>(realJobService),
      });
      const realClassService = e2eScope.resolve<IClassService>("classService");

      const oldImageKey = `e2e-old-${randomUUID()}.webp`;
      const newImageKey = `e2e-new-${randomUUID()}.webp`;
      mockImageService.simulateUpload(oldImageKey);
      mockImageService.simulateUpload(newImageKey);

      try {
        await realJobService.start();
        const { classId } = await createTermAndClass({ image: oldImageKey });

        // Validation failure rolls back both DB and any cleanup job
        await expect(
          realClassService.updateClass({
            id: classId,
            image: newImageKey,
            addedSchedules: [
              {
                localStartTime: Temporal.PlainTime.from("12:00:00"),
                localEndTime: Temporal.PlainTime.from("13:00:00"),
                volunteerUserIds: [instructorId],
                preferredVolunteerCount: 1,
                instructorUserIds: [instructorId],
                rule: { type: "single", extraDates: ["2026-07-20"] },
              },
            ],
            updatedSchedules: [],
            deletedSchedules: [],
          }),
        ).rejects.toThrow(
          "All assigned volunteers must have the volunteer role",
        );

        const [pendingAfterRollback] = await scope.db.execute<{
          count: number;
        }>(
          sql`SELECT count(*)::int AS count FROM pgboss.job WHERE name = ${DELETE_IMAGE_JOB_NAME} AND data->>'imageKey' = ${oldImageKey}`,
        );
        expect(pendingAfterRollback?.count).toBe(0);
        expect(mockImageService.storedImages.has(oldImageKey)).toBe(true);

        // Enqueueing inside a transaction that then aborts rolls back the inserted pg-boss job
        await expect(
          scope.db.transaction(async (tx) => {
            await realJobService.run(
              DELETE_IMAGE_JOB_NAME,
              { imageKey: oldImageKey },
              { transaction: tx },
            );
            throw new Error("abort after enqueue");
          }),
        ).rejects.toThrow("abort after enqueue");

        const [pendingAfterAbortedEnqueue] = await scope.db.execute<{
          count: number;
        }>(
          sql`SELECT count(*)::int AS count FROM pgboss.job WHERE name = ${DELETE_IMAGE_JOB_NAME} AND data->>'imageKey' = ${oldImageKey}`,
        );
        expect(pendingAfterAbortedEnqueue?.count).toBe(0);
        expect(mockImageService.storedImages.has(oldImageKey)).toBe(true);

        // Committed replacement delivers job to pg-boss worker and deletes oldImageKey
        await realClassService.updateClass({
          id: classId,
          image: newImageKey,
          addedSchedules: [],
          updatedSchedules: [],
          deletedSchedules: [],
        });

        const deadline = Date.now() + 10_000;
        while (
          mockImageService.storedImages.has(oldImageKey) &&
          Date.now() < deadline
        ) {
          await new Promise((r) => setTimeout(r, 100));
        }

        expect(mockImageService.storedImages.has(oldImageKey)).toBe(false);
        expect(mockImageService.storedImages.has(newImageKey)).toBe(true);
      } finally {
        await realJobService.stop().catch(() => {});
        await e2eScope.dispose().catch(() => {});
        await scope.db.execute(sql`DROP SCHEMA IF EXISTS pgboss CASCADE`);
      }
    });
  });
});
