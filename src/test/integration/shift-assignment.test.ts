import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { randomUUID } from "crypto";
import { readFileSync } from "node:fs";
import { Temporal } from "@js-temporal/polyfill";
import {
  course,
  coverageRequest,
  notification,
  schedule,
  shift,
  shiftVolunteerAssignment,
  term,
  user,
  volunteer,
} from "@/server/db/schema";
import { eq, inArray, sql } from "drizzle-orm";
import type { IClassService } from "@/server/services/entity/classService";
import type { ICoverageService } from "@/server/services/entity/coverageService";
import type { IShiftService } from "@/server/services/entity/shiftService";
import type { ITermService } from "@/server/services/entity/termService";
import { NotificationService } from "@/server/services/notificationService";
import { NotificationEventService } from "@/server/services/notificationEventService";
import { checkShiftNotificationsJob } from "@/server/jobs/definitions/check-shift-notifications.job";
import type { SingleShiftWithRosterContext } from "@/models/shift";
import {
  createTestScope,
  type ITestServiceScope,
} from "../helpers/test-service-scope";
import { MockJobService } from "../mocks/mock-job-service";
import {
  MockNotificationEventService,
  MockNotificationService,
  MockPreferenceService,
} from "../mocks/mock-notification-services";

describe("Effective shift assignments and historical preservation", () => {
  let scope: ITestServiceScope;
  let termService: ITermService;
  let classService: IClassService;
  let shiftService: IShiftService;
  let coverageService: ICoverageService;

  let createdUserIds: string[] = [];
  let createdTermIds: string[] = [];
  let createdClassIds: string[] = [];
  let createdNotificationIds: string[] = [];

  beforeEach(() => {
    scope = createTestScope();
    scope.mockSession.setAsAdmin();
    termService = scope.resolve<ITermService>("termService");
    classService = scope.resolve<IClassService>("classService");
    shiftService = scope.resolve<IShiftService>("shiftService");
    coverageService = scope.resolve<ICoverageService>("coverageService");
  });

  afterEach(async () => {
    if (createdNotificationIds.length > 0) {
      await scope.db
        .delete(notification)
        .where(inArray(notification.id, createdNotificationIds));
      createdNotificationIds = [];
    }
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

  async function createTestUser(
    role: "volunteer" | "instructor" | "admin",
    name: string,
    lastName = "Tester",
  ): Promise<string> {
    const id = randomUUID();
    await scope.db.insert(user).values({
      id,
      name,
      lastName,
      email: `${name.toLowerCase()}-${Date.now()}-${randomUUID()}@test.com`,
      role,
      status: "active",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    createdUserIds.push(id);

    if (role === "volunteer") {
      await scope.db.insert(volunteer).values({ userId: id });
    }

    return id;
  }

  const today = Temporal.Now.plainDateISO();
  const pastDate = today.subtract({ days: 40 }).toString();
  const futureDate1 = today.add({ days: 30 }).toString();
  const futureDate2 = today.add({ days: 37 }).toString();
  const futureDate3 = today.add({ days: 40 }).toString();
  const termStartDate = today.subtract({ days: 90 }).toString();
  const termEndDate = today.add({ days: 90 }).toString();

  function cursorForDate(isoDate: string): string {
    return isoDate.slice(0, 7);
  }

  async function createPublishedTerm(
    startDate = termStartDate,
    endDate = termEndDate,
  ): Promise<string> {
    const termId = await termService.createTerm({
      name: `Term ${randomUUID()}`,
      startDate,
      endDate,
      holidays: [],
    });
    createdTermIds.push(termId);
    await termService.publishTerm(termId);
    return termId;
  }

  async function createPublishedClass(params: {
    termId: string;
    name?: string;
    schedules: {
      startTime: string;
      endTime: string;
      dates: string[];
      volunteerUserIds: string[];
      instructorUserIds: string[];
    }[];
  }) {
    const classId = await classService.createClass({
      termId: params.termId,
      name: params.name ?? `Class ${randomUUID()}`,
      lowerLevel: 1,
      upperLevel: 2,
      category: "literacy",
      schedules: params.schedules.map((s) => ({
        localStartTime: Temporal.PlainTime.from(s.startTime),
        localEndTime: Temporal.PlainTime.from(s.endTime),
        volunteerUserIds: s.volunteerUserIds,
        preferredVolunteerCount: Math.max(1, s.volunteerUserIds.length),
        instructorUserIds: s.instructorUserIds,
        rule: {
          type: "single",
          extraDates: s.dates,
        },
      })),
    });
    createdClassIds.push(classId);

    await classService.publishClass(classId);

    const scheduleRows = await scope.db
      .select()
      .from(schedule)
      .where(eq(schedule.courseId, classId));

    const shiftRows = await scope.db
      .select()
      .from(shift)
      .where(eq(shift.courseId, classId));
    shiftRows.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());

    return { classId, schedules: scheduleRows, shifts: shiftRows };
  }

  describe("historical assignment edits", () => {
    it("backfills coverage origins without double-counting covering volunteers or losing round trips", async () => {
      const adminId = await createTestUser("admin", "Admin");
      scope.mockSession.setAsAdmin({ id: adminId });
      const v1 = await createTestUser("volunteer", "Origin");
      const v2 = await createTestUser("volunteer", "Middle");
      const v3 = await createTestUser("volunteer", "Coverer");
      const termId = await createPublishedTerm();
      const { shifts } = await createPublishedClass({
        termId,
        schedules: [
          {
            startTime: "10:00:00",
            endTime: "11:00:00",
            dates: [futureDate1, futureDate2],
            volunteerUserIds: [v1],
            instructorUserIds: [],
          },
        ],
      });
      const [chain, roundTrip] = shifts;
      for (const [target, finalVolunteer] of [
        [chain!, v3],
        [roundTrip!, v1],
      ] as const) {
        await scope.db.insert(coverageRequest).values([
          {
            shiftId: target.id,
            requestingVolunteerUserId: v1,
            coveredByVolunteerUserId: v2,
            status: "resolved",
            category: "health",
            details: "First handoff",
            requestedAt: new Date("2026-01-01T00:00:00Z"),
          },
          {
            shiftId: target.id,
            requestingVolunteerUserId: v2,
            coveredByVolunteerUserId: finalVolunteer,
            status: "resolved",
            category: "health",
            details: "Second handoff",
            requestedAt: new Date("2026-01-02T00:00:00Z"),
          },
        ]);
      }
      await shiftService.checkIn(chain!.id, v3);
      // Simulate a legacy schedule now containing a covering volunteer as well.
      await scope.db
        .execute(sql`INSERT INTO volunteer_to_schedule (schedule_id, volunteer_user_id)
        SELECT schedule_id, ${v3} FROM shift WHERE id = ${chain!.id}`);
      await scope.db.delete(shiftVolunteerAssignment).where(
        inArray(
          shiftVolunteerAssignment.shiftId,
          shifts.map((s) => s.id),
        ),
      );
      const migration = readFileSync(
        "src/server/db/migrations/0013_add_shift_assignments.sql",
        "utf8",
      );
      const backfill = migration.slice(
        migration.indexOf('INSERT INTO "shift_volunteer_assignment"'),
      );
      for (const statement of backfill.split("--> statement-breakpoint")) {
        if (statement.trim()) await scope.db.execute(sql.raw(statement));
      }
      const models = await shiftService.getShiftsByIds(shifts.map((s) => s.id));
      expect(
        models.find((s) => s.id === chain!.id)!.volunteers.map((v) => v.id),
      ).toEqual([v3]);
      expect(
        models.find((s) => s.id === chain!.id)!.volunteers[0]!.attendance,
      ).toBeTruthy();
      // v3 is a legacy base member on the second shift as well; the round trip
      // must restore v1 even though v1 also appears as an incoming coverer.
      expect(
        models
          .find((s) => s.id === roundTrip!.id)!
          .volunteers.map((v) => v.id)
          .sort(),
      ).toEqual([v1, v3].sort());
    });

    it("preserves past rosters, attendance, and visibility while updating future shifts", async () => {
      const adminId = await createTestUser("admin", "Admin");
      const v1 = await createTestUser("volunteer", "VolOne");
      const v2 = await createTestUser("volunteer", "VolTwo");
      const i1 = await createTestUser("instructor", "InstOne");
      const i2 = await createTestUser("instructor", "InstTwo");

      const termId = await createPublishedTerm();
      const { classId, schedules, shifts } = await createPublishedClass({
        termId,
        schedules: [
          {
            startTime: "10:00:00",
            endTime: "11:00:00",
            dates: [pastDate, futureDate1],
            volunteerUserIds: [v1],
            instructorUserIds: [i1],
          },
        ],
      });

      const scheduleId = schedules[0]!.id;
      const pastShift = shifts[0]!;
      const futureShift = shifts[1]!;

      // Record attendance for v1 on the past shift before schedule edit.
      scope.mockSession.setAsAdmin({ id: adminId });
      await shiftService.checkIn(pastShift.id, v1);

      // Edit schedule: remove v1 & i1, add v2 & i2.
      await classService.updateClass({
        id: classId,
        addedSchedules: [],
        deletedSchedules: [],
        updatedSchedules: [
          {
            id: scheduleId,
            addedVolunteerUserIds: [v2],
            removedVolunteerUserIds: [v1],
            addedInstructorUserIds: [i2],
            removedInstructorUserIds: [i1],
          },
        ],
      });

      // Past shift must retain v1 (with attendance) and i1, without retroactively adding v2 or i2.
      const pastView = (await shiftService.getShiftById(
        pastShift.id,
        adminId,
      )) as SingleShiftWithRosterContext;
      expect(pastView.volunteers.map((v) => v.id)).toEqual([v1]);
      expect(pastView.volunteers[0]!.attendance).toBeTruthy();
      expect(pastView.volunteers[0]!.attendance!.volunteerUserId).toBe(v1);
      expect(pastView.instructors.map((i) => i.id)).toEqual([i1]);

      // Future shift must reflect the updated schedule roster (v2 & i2).
      const futureView = (await shiftService.getShiftById(
        futureShift.id,
        adminId,
      )) as SingleShiftWithRosterContext;
      expect(futureView.volunteers.map((v) => v.id)).toEqual([v2]);
      expect(futureView.instructors.map((i) => i.id)).toEqual([i2]);

      // Volunteer visibility windows match historical vs future shift snapshots.
      scope.mockSession.setAsVolunteer({ id: v1 });
      const v1PastWindow = await shiftService.listWindow({
        cursor: cursorForDate(pastDate),
        userId: v1,
      });
      expect(v1PastWindow.shifts.map((s) => s.id)).toContain(pastShift.id);

      const v1FutureWindow = await shiftService.listWindow({
        cursor: cursorForDate(futureDate1),
        userId: v1,
      });
      expect(v1FutureWindow.shifts.map((s) => s.id)).not.toContain(
        futureShift.id,
      );

      scope.mockSession.setAsVolunteer({ id: v2 });
      const v2PastWindow = await shiftService.listWindow({
        cursor: cursorForDate(pastDate),
        userId: v2,
      });
      expect(v2PastWindow.shifts.map((s) => s.id)).not.toContain(pastShift.id);

      const v2FutureWindow = await shiftService.listWindow({
        cursor: cursorForDate(futureDate1),
        userId: v2,
      });
      expect(v2FutureWindow.shifts.map((s) => s.id)).toContain(futureShift.id);

      // Instructor visibility windows also follow historical shift snapshots.
      scope.mockSession.setAsInstructor({ id: i1 });
      const i1PastWindow = await shiftService.listWindow({
        cursor: cursorForDate(pastDate),
        userId: i1,
      });
      expect(i1PastWindow.shifts.map((s) => s.id)).toContain(pastShift.id);

      scope.mockSession.setAsInstructor({ id: i2 });
      const i2PastWindow = await shiftService.listWindow({
        cursor: cursorForDate(pastDate),
        userId: i2,
      });
      expect(i2PastWindow.shifts.map((s) => s.id)).not.toContain(pastShift.id);

      // No-checkin job on past shift sees v1 already checked in and does not flag v2.
      const mockEvents = new MockNotificationEventService();
      await checkShiftNotificationsJob.handler(
        { shiftId: pastShift.id, checkType: "no-checkin" },
        {
          cradle: {
            ...scope.container.cradle,
            notificationEventService: mockEvents,
          },
        } as never,
      );
      expect(mockEvents.calls).toHaveLength(0);

      // assertValidShift rejects removed v1 and accepts added v2 on the future shift.
      scope.mockSession.setAsAdmin({ id: adminId });
      await expect(
        shiftService.assertValidShift(v1, futureShift.id),
      ).rejects.toThrow();
      await expect(
        shiftService.assertValidShift(v2, futureShift.id),
      ).resolves.toBeUndefined();
    });

    it("withdraws open coverage requests when removing a volunteer from future shifts while keeping resolved covering volunteers", async () => {
      const adminId = await createTestUser("admin", "Admin");
      const v1 = await createTestUser("volunteer", "VolOne");
      const v2 = await createTestUser("volunteer", "VolTwo");
      const v3 = await createTestUser("volunteer", "VolThree");
      const i1 = await createTestUser("instructor", "InstOne");

      const termId = await createPublishedTerm();
      const { classId, schedules, shifts } = await createPublishedClass({
        termId,
        schedules: [
          {
            startTime: "10:00:00",
            endTime: "11:00:00",
            dates: [futureDate1, futureDate2],
            volunteerUserIds: [v1],
            instructorUserIds: [i1],
          },
        ],
      });

      const scheduleId = schedules[0]!.id;
      const shiftWithOpenCr = shifts[0]!;
      const shiftWithResolvedCr = shifts[1]!;

      const openCrId = await coverageService.createCoverageRequest(v1, {
        shiftId: shiftWithOpenCr.id,
        category: "emergency",
        details: "Open request",
      });
      const resolvedCrId = await coverageService.createCoverageRequest(v1, {
        shiftId: shiftWithResolvedCr.id,
        category: "emergency",
        details: "Resolved request",
      });
      await coverageService.fulfillCoverageRequest(v3, resolvedCrId);

      // Remove v1 from schedule and add v2.
      await classService.updateClass({
        id: classId,
        addedSchedules: [],
        deletedSchedules: [],
        updatedSchedules: [
          {
            id: scheduleId,
            addedVolunteerUserIds: [v2],
            removedVolunteerUserIds: [v1],
            addedInstructorUserIds: [],
            removedInstructorUserIds: [],
          },
        ],
      });

      // Open coverage request for removed v1 is withdrawn.
      const [openCrRow] = await scope.db
        .select({ status: coverageRequest.status })
        .from(coverageRequest)
        .where(eq(coverageRequest.id, openCrId));
      expect(openCrRow!.status).toBe("withdrawn");

      // Shift with resolved coverage keeps covering volunteer v3 alongside newly added v2, and does not bring back v1.
      const resolvedShiftView = (await shiftService.getShiftById(
        shiftWithResolvedCr.id,
        adminId,
      )) as SingleShiftWithRosterContext;
      expect(resolvedShiftView.volunteers.map((v) => v.id).sort()).toEqual(
        [v2, v3].sort(),
      );
      expect(
        resolvedShiftView.volunteers.find((v) => v.id === v3)?.coveringFor?.id,
      ).toBe(v1);
    });

    it("removes a round-trip volunteer on schedule edit while preserving canceled and checked-in future shifts", async () => {
      const adminId = await createTestUser("admin", "Admin");
      scope.mockSession.setAsAdmin({ id: adminId });
      const v1 = await createTestUser("volunteer", "VolOne");
      const v2 = await createTestUser("volunteer", "VolTwo");
      const v3 = await createTestUser("volunteer", "VolThree");
      const i1 = await createTestUser("instructor", "InstOne");

      const termId = await createPublishedTerm();
      const { classId, schedules, shifts } = await createPublishedClass({
        termId,
        schedules: [
          {
            startTime: "10:00:00",
            endTime: "11:00:00",
            dates: [futureDate1, futureDate2, futureDate3],
            volunteerUserIds: [v1],
            instructorUserIds: [i1],
          },
        ],
      });

      const [roundTripShift, canceledShift, checkedInShift] = shifts;

      // Round-trip v1 -> v2 -> v1 on roundTripShift.
      const cr1 = await coverageService.createCoverageRequest(v1, {
        shiftId: roundTripShift!.id,
        category: "health",
        details: "Out",
      });
      await coverageService.fulfillCoverageRequest(v2, cr1);
      const cr2 = await coverageService.createCoverageRequest(v2, {
        shiftId: roundTripShift!.id,
        category: "conflict",
        details: "Back to v1",
      });
      await coverageService.fulfillCoverageRequest(v1, cr2);

      // Cancel canceledShift and record early check-in on checkedInShift.
      await shiftService.cancelShift({
        shiftId: canceledShift!.id,
        cancelReason: "Holiday",
      });
      await shiftService.checkIn(checkedInShift!.id, v1);

      // Remove v1 and add v3 on the schedule.
      await classService.updateClass({
        id: classId,
        addedSchedules: [],
        deletedSchedules: [],
        updatedSchedules: [
          {
            id: schedules[0]!.id,
            addedVolunteerUserIds: [v3],
            removedVolunteerUserIds: [v1],
            addedInstructorUserIds: [],
            removedInstructorUserIds: [],
          },
        ],
      });

      const roundTripView = (await shiftService.getShiftById(
        roundTripShift!.id,
        adminId,
      )) as SingleShiftWithRosterContext;
      expect(roundTripView.volunteers.map((v) => v.id)).toEqual([v3]);

      const canceledView = (await shiftService.getShiftById(
        canceledShift!.id,
        adminId,
      )) as SingleShiftWithRosterContext;
      expect(canceledView.volunteers.map((v) => v.id)).toEqual([v1]);

      const checkedInView = (await shiftService.getShiftById(
        checkedInShift!.id,
        adminId,
      )) as SingleShiftWithRosterContext;
      expect(checkedInView.volunteers.map((v) => v.id).sort()).toEqual(
        [v1, v3].sort(),
      );
      expect(
        (
          await shiftService.getShiftsByIds([checkedInShift!.id])
        )[0]!.volunteers.find((v) => v.id === v1)?.attendance,
      ).toBeTruthy();
    });
  });

  describe("substitutions and withdrawals across shift reads, reminders, cancellations, and visibility", () => {
    it("keeps shift reads, reminders, no-checkin, cancellation recipients, and coverage visibility consistent through substitution", async () => {
      const adminId = await createTestUser("admin", "Admin");
      const v1 = await createTestUser("volunteer", "Original");
      const v2 = await createTestUser("volunteer", "CoVolunteer");
      const v3 = await createTestUser("volunteer", "Covering");
      const i1 = await createTestUser("instructor", "Instructor");

      const termId = await createPublishedTerm();
      const { shifts } = await createPublishedClass({
        termId,
        schedules: [
          {
            startTime: "10:00:00",
            endTime: "11:00:00",
            dates: [futureDate1],
            volunteerUserIds: [v1, v2],
            instructorUserIds: [i1],
          },
        ],
      });
      const targetShift = shifts[0]!;

      // v1 requests coverage; v3 fulfills it.
      const cr1Id = await coverageService.createCoverageRequest(v1, {
        shiftId: targetShift.id,
        category: "health",
        details: "Sick",
      });
      await coverageService.fulfillCoverageRequest(v3, cr1Id);

      // 1. Shift read shows v2 and covering v3 (coveringFor v1), not released v1.
      const shiftView = (await shiftService.getShiftById(
        targetShift.id,
        adminId,
      )) as SingleShiftWithRosterContext;
      expect(shiftView.volunteers.map((v) => v.id).sort()).toEqual(
        [v2, v3].sort(),
      );
      expect(
        shiftView.volunteers.find((v) => v.id === v3)?.coveringFor?.id,
      ).toBe(v1);

      // 2. assertValidShift follows effective roster: v3 valid, v1 invalid.
      await expect(
        shiftService.assertValidShift(v3, targetShift.id),
      ).resolves.toBeUndefined();
      await expect(
        shiftService.assertValidShift(v1, targetShift.id),
      ).rejects.toThrow();

      // 3. Reminder job notifies v2 and v3 (not released v1).
      const mockEvents = new MockNotificationEventService();
      await checkShiftNotificationsJob.handler(
        { shiftId: targetShift.id, checkType: "reminder" },
        {
          cradle: {
            ...scope.container.cradle,
            notificationEventService: mockEvents,
          },
        } as never,
      );
      expect(mockEvents.calls).toHaveLength(1);
      expect(mockEvents.calls[0]!.method).toBe("notifyShiftReminder");
      const reminderParams = mockEvents.calls[0]!.params as {
        volunteerUserIds: string[];
      };
      expect(reminderParams.volunteerUserIds.sort()).toEqual([v2, v3].sort());

      // 4. No-checkin job flags v2 and v3 (not released v1). If v3 checks in, only v2 is flagged.
      mockEvents.clear();
      await shiftService.checkIn(targetShift.id, v3);
      await checkShiftNotificationsJob.handler(
        { shiftId: targetShift.id, checkType: "no-checkin" },
        {
          cradle: {
            ...scope.container.cradle,
            notificationEventService: mockEvents,
          },
        } as never,
      );
      expect(mockEvents.calls).toHaveLength(1);
      const noCheckinParams = mockEvents.calls[0]!.params as {
        volunteerCount: number;
        volunteerNames: string;
      };
      expect(noCheckinParams.volunteerCount).toBe(1);
      expect(noCheckinParams.volunteerNames).toContain("CoVolunteer");
      expect(noCheckinParams.volunteerNames).not.toContain("Original");
      expect(noCheckinParams.volunteerNames).not.toContain("Covering");

      // 5. Cancellation audience (`{ kind: "shift", shiftId }`) notifies v2, v3, and i1 — NOT released v1.
      const realNotificationService = new NotificationService({
        db: scope.db,
        jobService: new MockJobService(),
        preferenceService: new MockPreferenceService(),
      });
      await realNotificationService.processNotification({
        type: "shift.cancelled",
        audience: { kind: "shift", shiftId: targetShift.id },
        context: {
          shiftId: targetShift.id,
          className: "Test Class",
          shiftDate: "2028-07-15",
          cancelReason: "Weather",
          cancelledByName: "Admin Tester",
        },
        idempotencyKey: `test-cancel-${targetShift.id}`,
      });

      const createdNotifs = await scope.db
        .select({ id: notification.id, userId: notification.userId })
        .from(notification)
        .where(eq(notification.sourceId, targetShift.id));
      createdNotificationIds.push(...createdNotifs.map((n) => n.id));

      expect(createdNotifs.map((n) => n.userId).sort()).toEqual(
        [i1, v2, v3].sort(),
      );

      // 6. Open coverage request from v2 on same shift: covering v3 is already assigned (cannot see it as open),
      // while released v1 is no longer effectively assigned to the shift.
      await coverageService.createCoverageRequest(v2, {
        shiftId: targetShift.id,
        category: "conflict",
        details: "Need cover too",
      });

      scope.mockSession.setAsVolunteer({ id: v3 });
      const v3Requests = await coverageService.listCoverageRequests({
        status: "open",
      });
      expect(v3Requests.data).toHaveLength(0);

      scope.mockSession.setAsVolunteer({ id: v1 });
      const v1OpenRequests = await coverageService.listCoverageRequests({
        status: "open",
      });
      expect(v1OpenRequests.data).toHaveLength(1);
      expect(v1OpenRequests.data[0]!.requestingVolunteer.id).toBe(v2);
    });

    it("retains the original volunteer across all consumers when a coverage request is withdrawn", async () => {
      const adminId = await createTestUser("admin", "Admin");
      const v1 = await createTestUser("volunteer", "Withdrawer");
      const i1 = await createTestUser("instructor", "Instructor");

      const termId = await createPublishedTerm();
      const { shifts } = await createPublishedClass({
        termId,
        schedules: [
          {
            startTime: "10:00:00",
            endTime: "11:00:00",
            dates: [futureDate2],
            volunteerUserIds: [v1],
            instructorUserIds: [i1],
          },
        ],
      });
      const targetShift = shifts[0]!;

      const crId = await coverageService.createCoverageRequest(v1, {
        shiftId: targetShift.id,
        category: "emergency",
        details: "Thought I could not make it",
      });
      await coverageService.cancelCoverageRequest(v1, crId);

      // Shift read still includes v1.
      const shiftView = (await shiftService.getShiftById(
        targetShift.id,
        adminId,
      )) as SingleShiftWithRosterContext;
      expect(shiftView.volunteers.map((v) => v.id)).toEqual([v1]);

      // Reminder job still targets v1.
      const mockEvents = new MockNotificationEventService();
      await checkShiftNotificationsJob.handler(
        { shiftId: targetShift.id, checkType: "reminder" },
        {
          cradle: {
            ...scope.container.cradle,
            notificationEventService: mockEvents,
          },
        } as never,
      );
      expect(mockEvents.calls).toHaveLength(1);
      expect(
        (mockEvents.calls[0]!.params as { volunteerUserIds: string[] })
          .volunteerUserIds,
      ).toEqual([v1]);

      // Cancellation audience still includes v1 and i1.
      const realNotificationService = new NotificationService({
        db: scope.db,
        jobService: new MockJobService(),
        preferenceService: new MockPreferenceService(),
      });
      await realNotificationService.processNotification({
        type: "shift.cancelled",
        audience: { kind: "shift", shiftId: targetShift.id },
        context: {
          shiftId: targetShift.id,
          className: "Test Class",
          shiftDate: "2028-07-20",
          cancelReason: "Room unavailable",
          cancelledByName: "Admin Tester",
        },
        idempotencyKey: `test-cancel-withdrawn-${targetShift.id}`,
      });

      const createdNotifs = await scope.db
        .select({ id: notification.id, userId: notification.userId })
        .from(notification)
        .where(eq(notification.sourceId, targetShift.id));
      createdNotificationIds.push(...createdNotifs.map((n) => n.id));
      expect(createdNotifs.map((n) => n.userId).sort()).toEqual(
        [i1, v1].sort(),
      );
    });

    it("resolves chained substitutions (v1 -> v2 -> v3) consistently across all consumers", async () => {
      const adminId = await createTestUser("admin", "Admin");
      scope.mockSession.setAsAdmin({ id: adminId });
      const v1 = await createTestUser("volunteer", "First");
      const v2 = await createTestUser("volunteer", "Second");
      const v3 = await createTestUser("volunteer", "Third");
      const i1 = await createTestUser("instructor", "Instructor");

      const termId = await createPublishedTerm();
      const { shifts } = await createPublishedClass({
        termId,
        schedules: [
          {
            startTime: "10:00:00",
            endTime: "11:00:00",
            dates: [futureDate1],
            volunteerUserIds: [v1],
            instructorUserIds: [i1],
          },
        ],
      });
      const targetShift = shifts[0]!;

      // v1 -> v2
      const cr1Id = await coverageService.createCoverageRequest(v1, {
        shiftId: targetShift.id,
        category: "health",
        details: "First handoff",
      });
      await coverageService.fulfillCoverageRequest(v2, cr1Id);

      // v2 -> v3 (valid because v2 is effectively assigned to targetShift)
      const cr2Id = await coverageService.createCoverageRequest(v2, {
        shiftId: targetShift.id,
        category: "conflict",
        details: "Second handoff",
      });
      await coverageService.fulfillCoverageRequest(v3, cr2Id);

      // Shift read shows only v3 (covering for v2)
      const shiftView = (await shiftService.getShiftById(
        targetShift.id,
        adminId,
      )) as SingleShiftWithRosterContext;
      expect(shiftView.volunteers.map((v) => v.id)).toEqual([v3]);
      expect(shiftView.volunteers[0]!.coveringFor?.id).toBe(v2);

      // assertValidShift accepts only v3
      await expect(
        shiftService.assertValidShift(v1, targetShift.id),
      ).rejects.toThrow();
      await expect(
        shiftService.assertValidShift(v2, targetShift.id),
      ).rejects.toThrow();
      await expect(
        shiftService.assertValidShift(v3, targetShift.id),
      ).resolves.toBeUndefined();

      // Reminder job notifies only v3
      const mockEvents = new MockNotificationEventService();
      await checkShiftNotificationsJob.handler(
        { shiftId: targetShift.id, checkType: "reminder" },
        {
          cradle: {
            ...scope.container.cradle,
            notificationEventService: mockEvents,
          },
        } as never,
      );
      expect(mockEvents.calls).toHaveLength(1);
      expect(
        (mockEvents.calls[0]!.params as { volunteerUserIds: string[] })
          .volunteerUserIds,
      ).toEqual([v3]);

      // Cancellation audience notifies only v3 and i1 (not v1 or v2)
      const realNotificationService = new NotificationService({
        db: scope.db,
        jobService: new MockJobService(),
        preferenceService: new MockPreferenceService(),
      });
      await realNotificationService.processNotification({
        type: "shift.cancelled",
        audience: { kind: "shift", shiftId: targetShift.id },
        context: {
          shiftId: targetShift.id,
          className: "Chained Class",
          shiftDate: futureDate1,
          cancelReason: "Weather",
          cancelledByName: "Admin Tester",
        },
        idempotencyKey: `test-cancel-chain-${targetShift.id}`,
      });

      const createdNotifs = await scope.db
        .select({ id: notification.id, userId: notification.userId })
        .from(notification)
        .where(eq(notification.sourceId, targetShift.id));
      createdNotificationIds.push(...createdNotifs.map((n) => n.id));
      expect(createdNotifs.map((n) => n.userId).sort()).toEqual(
        [i1, v3].sort(),
      );
    });
  });

  describe("coverage eligibility with overlapping, released, covering, and withdrawn assignments", () => {
    it("includes released volunteers and excludes covering, base-assigned, and withdrawn-request overlapping volunteers", async () => {
      const adminId = await createTestUser("admin", "Admin");
      scope.mockSession.setAsAdmin({ id: adminId });
      const vRequester = await createTestUser("volunteer", "Requester");
      const vBaseConflict = await createTestUser("volunteer", "BaseConflict");
      const vReleased = await createTestUser("volunteer", "Released");
      const vCovering = await createTestUser("volunteer", "Covering");
      const vWithdrawn = await createTestUser("volunteer", "Withdrawn");
      const vCanceledOverlap = await createTestUser(
        "volunteer",
        "CanceledOverlap",
      );
      const i1 = await createTestUser("instructor", "Instructor");

      const termId = await createPublishedTerm();

      // Class A: target shift on futureDate1 10:00-11:00 (vRequester),
      // plus another schedule on futureDate3 so all candidate volunteers belong to Class A.
      const classA = await createPublishedClass({
        termId,
        name: "Class A",
        schedules: [
          {
            startTime: "10:00:00",
            endTime: "11:00:00",
            dates: [futureDate1],
            volunteerUserIds: [vRequester],
            instructorUserIds: [i1],
          },
          {
            startTime: "10:00:00",
            endTime: "11:00:00",
            dates: [futureDate3],
            volunteerUserIds: [
              vBaseConflict,
              vReleased,
              vCovering,
              vWithdrawn,
              vCanceledOverlap,
            ],
            instructorUserIds: [i1],
          },
        ],
      });
      const targetShift = classA.shifts.find((s) => s.date === futureDate1)!;

      // Class B: overlapping shifts on futureDate1 10:30-11:30.
      // 1) vBaseConflict has an active overlapping shift -> ineligible.
      await createPublishedClass({
        termId,
        name: "Class B Base",
        schedules: [
          {
            startTime: "10:30:00",
            endTime: "11:30:00",
            dates: [futureDate1],
            volunteerUserIds: [vBaseConflict],
            instructorUserIds: [i1],
          },
        ],
      });

      // 2) vReleased had an overlapping shift, covered by vCovering ->
      //    vReleased is now ELIGIBLE; vCovering is now INELIGIBLE.
      const classBSubstituted = await createPublishedClass({
        termId,
        name: "Class B Substituted",
        schedules: [
          {
            startTime: "10:30:00",
            endTime: "11:30:00",
            dates: [futureDate1],
            volunteerUserIds: [vReleased],
            instructorUserIds: [i1],
          },
        ],
      });
      const subShift = classBSubstituted.shifts[0]!;
      const subCrId = await coverageService.createCoverageRequest(vReleased, {
        shiftId: subShift.id,
        category: "conflict",
        details: "Need swap",
      });
      await coverageService.fulfillCoverageRequest(vCovering, subCrId);

      // 3) vWithdrawn requested coverage on an overlapping shift and withdrew it ->
      //    still effectively assigned -> INELIGIBLE.
      const classBWithdrawn = await createPublishedClass({
        termId,
        name: "Class B Withdrawn",
        schedules: [
          {
            startTime: "10:30:00",
            endTime: "11:30:00",
            dates: [futureDate1],
            volunteerUserIds: [vWithdrawn],
            instructorUserIds: [i1],
          },
        ],
      });
      const withdrawnShift = classBWithdrawn.shifts[0]!;
      const withdrawnCrId = await coverageService.createCoverageRequest(
        vWithdrawn,
        {
          shiftId: withdrawnShift.id,
          category: "conflict",
          details: "Never mind",
        },
      );
      await coverageService.cancelCoverageRequest(vWithdrawn, withdrawnCrId);

      // 4) vCanceledOverlap had an overlapping shift that was canceled -> ELIGIBLE.
      const classBCanceled = await createPublishedClass({
        termId,
        name: "Class B Canceled",
        schedules: [
          {
            startTime: "10:30:00",
            endTime: "11:30:00",
            dates: [futureDate1],
            volunteerUserIds: [vCanceledOverlap],
            instructorUserIds: [i1],
          },
        ],
      });
      await shiftService.cancelShift({
        shiftId: classBCanceled.shifts[0]!.id,
        cancelReason: "Holiday closure",
      });

      // Trigger real NotificationEventService.notifyCoverageRequested and inspect eligible audience.
      const mockNotificationService = new MockNotificationService();
      const notificationEventService = new NotificationEventService({
        notificationService: mockNotificationService,
        db: scope.db,
      });

      await notificationEventService.notifyCoverageRequested({
        coverageRequestId: randomUUID(),
        shiftId: targetShift.id,
        classId: classA.classId,
        className: "Class A",
        shiftDate: "2028-08-10",
        shiftStartAt: targetShift.startAt,
        shiftEndAt: targetShift.endAt,
        requestingVolunteerUserId: vRequester,
        requestingVolunteerName: "Requester Tester",
        reason: "Appointment",
      });

      const coverageAvailableCall = mockNotificationService.calls.find(
        (c) => c.type === "coverage.available",
      );
      expect(coverageAvailableCall).toBeDefined();
      expect(coverageAvailableCall!.audience).toEqual({
        kind: "users",
        userIds: expect.any(Array),
      });

      const eligibleIds = (
        coverageAvailableCall!.audience as { kind: "users"; userIds: string[] }
      ).userIds;
      expect(eligibleIds.sort()).toEqual([vCanceledOverlap, vReleased].sort());
    });
  });
});
