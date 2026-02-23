import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { randomUUID } from "crypto";
import { Temporal } from "@js-temporal/polyfill";
import { shift, user, volunteer, term, course } from "@/server/db/schema";
import { eq, inArray } from "drizzle-orm";
import type { IShiftService } from "@/server/services/entity/shiftService";
import type { IClassService } from "@/server/services/entity/classService";
import type { ITermService } from "@/server/services/entity/termService";
import {
  createTestScope,
  type ITestServiceScope,
} from "../helpers/test-service-scope";

describe("ShiftService", () => {
  let scope: ITestServiceScope;
  let termService: ITermService;
  let classService: IClassService;
  let shiftService: IShiftService;

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
    shiftService = scope.resolve<IShiftService>("shiftService");
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

  async function createPublishedClassInTerm(opts?: {
    publishTerm?: boolean;
  }): Promise<{ termId: string; classId: string; shiftId: string }> {
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

    await classService.publishClass(classId);

    const shifts = await scope.db
      .select()
      .from(shift)
      .where(eq(shift.courseId, classId));
    const shiftId = shifts[0]!.id;

    return { termId, classId, shiftId };
  }

  describe("term published visibility", () => {
    it("admin should see shifts in unpublished terms", async () => {
      const { shiftId } = await createPublishedClassInTerm({
        publishTerm: false,
      });

      const result = await shiftService.getShiftById(shiftId, volunteerId);
      expect(result.id).toBe(shiftId);
    });

    it("volunteer should not see shifts in unpublished terms", async () => {
      const { shiftId } = await createPublishedClassInTerm({
        publishTerm: false,
      });

      scope.mockSession.setAsVolunteer({ id: volunteerId });

      const result = await shiftService.getShiftsByIds([shiftId]);
      expect(result).toHaveLength(0);
    });

    it("volunteer should see shifts in published terms", async () => {
      const { shiftId } = await createPublishedClassInTerm({
        publishTerm: true,
      });

      scope.mockSession.setAsVolunteer({ id: volunteerId });

      const result = await shiftService.getShiftsByIds([shiftId]);
      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBe(shiftId);
    });

    it("volunteer listWindow should exclude shifts from unpublished terms", async () => {
      await createPublishedClassInTerm({ publishTerm: false });

      scope.mockSession.setAsVolunteer({ id: volunteerId });

      const result = await shiftService.listWindow({
        cursor: "2026-07",
        userId: volunteerId,
      });
      expect(result.shifts).toHaveLength(0);
    });

    it("volunteer listWindow should include shifts from published terms", async () => {
      await createPublishedClassInTerm({ publishTerm: true });

      scope.mockSession.setAsVolunteer({ id: volunteerId });

      const result = await shiftService.listWindow({
        cursor: "2026-07",
        userId: volunteerId,
      });
      expect(result.shifts.length).toBeGreaterThanOrEqual(1);
    });
  });
});
