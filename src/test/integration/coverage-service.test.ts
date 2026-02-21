import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { randomUUID } from "crypto";
import { Temporal } from "@js-temporal/polyfill";
import { shift, user, volunteer, term, course } from "@/server/db/schema";
import { eq, inArray } from "drizzle-orm";
import { Role } from "@/models/interfaces";
import type { ICoverageService } from "@/server/services/entity/coverageService";
import type { ITermService } from "@/server/services/entity/termService";
import type { IClassService } from "@/server/services/entity/classService";
import {
  createTestScope,
  type ITestServiceScope,
} from "../helpers/test-service-scope";

describe("CoverageService", () => {
  let scope: ITestServiceScope;
  let coverageService: ICoverageService;
  let termService: ITermService;
  let classService: IClassService;

  let createdUserIds: string[] = [];
  let createdTermIds: string[] = [];
  let createdClassIds: string[] = [];

  let volunteer1Id: string;
  let volunteer2Id: string;
  let volunteer3Id: string; // Not assigned to the schedule - can cover shifts
  let instructorId: string;
  let shiftId: string;
  let classId: string;
  const className = "Test Class";

  beforeEach(() => {
    scope = createTestScope();
    scope.mockSession.setAsAdmin();
    coverageService = scope.resolve<ICoverageService>("coverageService");
    termService = scope.resolve<ITermService>("termService");
    classService = scope.resolve<IClassService>("classService");
  });

  beforeEach(async () => {
    volunteer1Id = randomUUID();
    volunteer2Id = randomUUID();
    volunteer3Id = randomUUID();
    instructorId = randomUUID();

    await scope.db.insert(user).values([
      {
        id: volunteer1Id,
        name: "Vol",
        lastName: "One",
        email: `vol1-${Date.now()}-${randomUUID()}@test.com`,
        role: "volunteer",
        status: "active",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: volunteer2Id,
        name: "Vol",
        lastName: "Two",
        email: `vol2-${Date.now()}-${randomUUID()}@test.com`,
        role: "volunteer",
        status: "active",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: volunteer3Id,
        name: "Vol",
        lastName: "Three",
        email: `vol3-${Date.now()}-${randomUUID()}@test.com`,
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
    createdUserIds.push(volunteer1Id, volunteer2Id, volunteer3Id, instructorId);

    await scope.db
      .insert(volunteer)
      .values([
        { userId: volunteer1Id },
        { userId: volunteer2Id },
        { userId: volunteer3Id },
      ]);

    const termId = await termService.createTerm({
      name: `Test Term ${randomUUID()}`,
      startDate: "2026-06-01",
      endDate: "2026-08-31",
      holidays: [],
    });
    createdTermIds.push(termId);

    classId = await classService.createClass({
      termId,
      name: className,
      lowerLevel: 1,
      upperLevel: 2,
      category: "literacy",
      schedules: [
        {
          localStartTime: Temporal.PlainTime.from("10:00:00"),
          localEndTime: Temporal.PlainTime.from("11:00:00"),
          volunteerUserIds: [volunteer1Id, volunteer2Id],
          preferredVolunteerCount: 2,
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
    shiftId = shifts[0]!.id;
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

  describe("listCoverageRequests", () => {
    it("should return empty list when no coverage requests exist", async () => {
      const result = await coverageService.listCoverageRequests(
        {},
        volunteer1Id,
        Role.admin,
      );

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it("should return coverage requests with embedded shift info", async () => {
      await coverageService.createCoverageRequest(volunteer1Id, {
        shiftId,
        category: "emergency",
        details: "Need coverage",
      });

      const result = await coverageService.listCoverageRequests(
        {},
        volunteer1Id,
        Role.admin,
      );

      expect(result.data).toHaveLength(1);
      const item = result.data[0]!;
      expect(item.shift).toBeDefined();
      expect(item.shift.id).toBe(shiftId);
      expect(item.requestedAt).toBeInstanceOf(Date);
      expect(item.shift.date).toBeDefined();
      expect(item.shift.startAt).toBeInstanceOf(Date);
      expect(item.shift.endAt).toBeInstanceOf(Date);
      expect(item.shift.class.id).toBe(classId);
      expect(item.shift.class.name).toBe(className);
      expect(item.shift.instructors).toHaveLength(1);
      expect(item.shift.instructors[0]!.name).toBe("Inst");
    });

    it("should include category/details/comments for admin", async () => {
      await coverageService.createCoverageRequest(volunteer1Id, {
        shiftId,
        category: "health",
        details: "Feeling unwell",
        comments: "Will be back next week",
      });

      const result = await coverageService.listCoverageRequests(
        {},
        volunteer1Id,
        Role.admin,
      );

      const item = result.data[0]! as Record<string, unknown>;
      expect(item.category).toBe("health");
      expect(item.details).toBe("Feeling unwell");
      expect(item.comments).toBe("Will be back next week");
    });

    it("should only show open or own requests for volunteers", async () => {
      const requestId = await coverageService.createCoverageRequest(
        volunteer1Id,
        {
          shiftId,
          category: "emergency",
          details: "Need coverage",
        },
      );

      // Volunteer3 (not assigned to shift) sees the open request
      const result1 = await coverageService.listCoverageRequests(
        {},
        volunteer3Id,
        Role.volunteer,
      );
      expect(result1.data).toHaveLength(1);

      // Volunteer2 (assigned to shift) does NOT see the open request
      const result1b = await coverageService.listCoverageRequests(
        {},
        volunteer2Id,
        Role.volunteer,
      );
      expect(result1b.data).toHaveLength(0);

      // Cancel the request
      await coverageService.cancelCoverageRequest(volunteer1Id, requestId);

      // Volunteer3 no longer sees the withdrawn request
      const result2 = await coverageService.listCoverageRequests(
        {},
        volunteer3Id,
        Role.volunteer,
      );
      expect(result2.data).toHaveLength(0);

      // Volunteer1 still sees their own withdrawn request
      const result3 = await coverageService.listCoverageRequests(
        {},
        volunteer1Id,
        Role.volunteer,
      );
      expect(result3.data).toHaveLength(1);
      expect(result3.data[0]!.status).toBe("withdrawn");
    });

    it("should support status filter", async () => {
      await coverageService.createCoverageRequest(volunteer1Id, {
        shiftId,
        category: "emergency",
        details: "Need coverage",
      });

      const openResult = await coverageService.listCoverageRequests(
        { status: "open" },
        volunteer1Id,
        Role.admin,
      );
      expect(openResult.data).toHaveLength(1);

      const withdrawnResult = await coverageService.listCoverageRequests(
        { status: "withdrawn" },
        volunteer1Id,
        Role.admin,
      );
      expect(withdrawnResult.data).toHaveLength(0);
    });

    describe("sortOrder", () => {
      let shiftIds: string[];

      beforeEach(async () => {
        // Create a class with 3 shifts on different dates
        const multiShiftClassId = await classService.createClass({
          termId: createdTermIds[0]!,
          name: "Sort Test Class",
          lowerLevel: 1,
          upperLevel: 2,
          category: "literacy",
          schedules: [
            {
              localStartTime: Temporal.PlainTime.from("10:00:00"),
              localEndTime: Temporal.PlainTime.from("11:00:00"),
              volunteerUserIds: [volunteer1Id, volunteer2Id],
              preferredVolunteerCount: 2,
              instructorUserIds: [instructorId],
              rule: {
                type: "single",
                extraDates: ["2026-07-01", "2026-07-15", "2026-08-01"],
              },
            },
          ],
        });
        createdClassIds.push(multiShiftClassId);

        await classService.publishClass(multiShiftClassId);

        const shifts = await scope.db
          .select()
          .from(shift)
          .where(eq(shift.courseId, multiShiftClassId));

        // Sort by startAt ascending so shiftIds[0] is earliest, [2] is latest
        shifts.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
        shiftIds = shifts.map((s) => s.id);

        // Create coverage requests on each shift
        for (const id of shiftIds) {
          await coverageService.createCoverageRequest(volunteer1Id, {
            shiftId: id,
            category: "emergency",
            details: "Need coverage",
          });
        }
      });

      it("should return results in ascending order when sortOrder is asc", async () => {
        const result = await coverageService.listCoverageRequests(
          { sortOrder: "asc" },
          volunteer1Id,
          Role.admin,
        );

        const resultShiftIds = result.data.map((item) => item.shift.id);
        expect(resultShiftIds).toEqual(shiftIds);
      });

      it("should return results in descending order when sortOrder is desc", async () => {
        const result = await coverageService.listCoverageRequests(
          { sortOrder: "desc" },
          volunteer1Id,
          Role.admin,
        );

        const resultShiftIds = result.data.map((item) => item.shift.id);
        expect(resultShiftIds).toEqual([...shiftIds].reverse());
      });

      it("should default to descending order when sortOrder is not specified", async () => {
        const result = await coverageService.listCoverageRequests(
          {},
          volunteer1Id,
          Role.admin,
        );

        const multiShiftResults = result.data.filter((item) =>
          shiftIds.includes(item.shift.id),
        );
        const resultShiftIds = multiShiftResults.map((item) => item.shift.id);
        expect(resultShiftIds).toEqual([...shiftIds].reverse());
      });
    });
  });

  describe("getCoverageRequestByIds", () => {
    it("should return coverage requests with embedded shift info", async () => {
      const requestId = await coverageService.createCoverageRequest(
        volunteer1Id,
        {
          shiftId,
          category: "conflict",
          details: "Schedule conflict",
        },
      );

      const results = await coverageService.getCoverageRequestByIds([
        requestId,
      ]);

      expect(results).toHaveLength(1);
      const request = results[0]!;
      expect(request.shift.id).toBe(shiftId);
      expect(request.shift.class.id).toBe(classId);
      expect(request.shift.class.name).toBe(className);
      expect(request.shift.instructors).toHaveLength(1);
      expect(request.requestedAt).toBeInstanceOf(Date);
      expect(request.shift.date).toBeDefined();
      expect(request.shift.startAt).toBeInstanceOf(Date);
      expect(request.shift.endAt).toBeInstanceOf(Date);
    });

    it("should throw when ID not found", async () => {
      await expect(
        coverageService.getCoverageRequestByIds([randomUUID()]),
      ).rejects.toThrow();
    });
  });

  describe("createCoverageRequest", () => {
    it("should create a coverage request and return its ID", async () => {
      const requestId = await coverageService.createCoverageRequest(
        volunteer1Id,
        {
          shiftId,
          category: "transportation",
          details: "Car broke down",
        },
      );

      expect(requestId).toBeDefined();
      expect(typeof requestId).toBe("string");
    });

    it("should reject duplicate active request for same shift", async () => {
      await coverageService.createCoverageRequest(volunteer1Id, {
        shiftId,
        category: "emergency",
        details: "First request",
      });

      await expect(
        coverageService.createCoverageRequest(volunteer1Id, {
          shiftId,
          category: "emergency",
          details: "Duplicate request",
        }),
      ).rejects.toThrow();
    });
  });

  describe("cancelCoverageRequest", () => {
    it("should cancel an open request", async () => {
      const requestId = await coverageService.createCoverageRequest(
        volunteer1Id,
        {
          shiftId,
          category: "emergency",
          details: "Need coverage",
        },
      );

      await coverageService.cancelCoverageRequest(volunteer1Id, requestId);

      const [request] = await coverageService.getCoverageRequestByIds([
        requestId,
      ]);
      expect(request!.status).toBe("withdrawn");
    });

    it("should reject canceling a non-open request", async () => {
      const requestId = await coverageService.createCoverageRequest(
        volunteer1Id,
        {
          shiftId,
          category: "emergency",
          details: "Need coverage",
        },
      );

      await coverageService.cancelCoverageRequest(volunteer1Id, requestId);

      await expect(
        coverageService.cancelCoverageRequest(volunteer1Id, requestId),
      ).rejects.toThrow();
    });

    it("should reject canceling another volunteer's request", async () => {
      const requestId = await coverageService.createCoverageRequest(
        volunteer1Id,
        {
          shiftId,
          category: "emergency",
          details: "Need coverage",
        },
      );

      await expect(
        coverageService.cancelCoverageRequest(volunteer2Id, requestId),
      ).rejects.toThrow();
    });
  });

  describe("fulfillCoverageRequest", () => {
    it("should fill an open request", async () => {
      const requestId = await coverageService.createCoverageRequest(
        volunteer1Id,
        {
          shiftId,
          category: "emergency",
          details: "Need coverage",
        },
      );

      // volunteer3Id is NOT assigned to the shift, so they can cover it
      await coverageService.fulfillCoverageRequest(volunteer3Id, requestId);

      const [request] = await coverageService.getCoverageRequestByIds([
        requestId,
      ]);
      expect(request!.status).toBe("resolved");
      expect(request!.coveringVolunteer).toBeDefined();
      expect(request!.coveringVolunteer!.id).toBe(volunteer3Id);
    });

    it("should reject filling a non-open request", async () => {
      const requestId = await coverageService.createCoverageRequest(
        volunteer1Id,
        {
          shiftId,
          category: "emergency",
          details: "Need coverage",
        },
      );

      await coverageService.cancelCoverageRequest(volunteer1Id, requestId);

      await expect(
        coverageService.fulfillCoverageRequest(volunteer3Id, requestId),
      ).rejects.toThrow();
    });

    it("should reject filling request for shift volunteer is assigned to", async () => {
      const requestId = await coverageService.createCoverageRequest(
        volunteer1Id,
        {
          shiftId,
          category: "emergency",
          details: "Need coverage",
        },
      );

      // volunteer2Id IS assigned to the shift, so they cannot cover it
      await expect(
        coverageService.fulfillCoverageRequest(volunteer2Id, requestId),
      ).rejects.toThrow("Cannot cover a shift you are already assigned to.");
    });
  });

  describe("unassignCoverage", () => {
    it("should unassign a filled request", async () => {
      const requestId = await coverageService.createCoverageRequest(
        volunteer1Id,
        {
          shiftId,
          category: "emergency",
          details: "Need coverage",
        },
      );

      // volunteer3Id is NOT assigned to the shift, so they can cover it
      await coverageService.fulfillCoverageRequest(volunteer3Id, requestId);
      await coverageService.unassignCoverage(volunteer3Id, requestId);

      const [request] = await coverageService.getCoverageRequestByIds([
        requestId,
      ]);
      expect(request!.status).toBe("open");
      expect(request!.coveringVolunteer).toBeUndefined();
    });

    it("should reject unassigning by wrong volunteer", async () => {
      const requestId = await coverageService.createCoverageRequest(
        volunteer1Id,
        {
          shiftId,
          category: "emergency",
          details: "Need coverage",
        },
      );

      // volunteer3Id is NOT assigned to the shift, so they can cover it
      await coverageService.fulfillCoverageRequest(volunteer3Id, requestId);

      await expect(
        coverageService.unassignCoverage(volunteer1Id, requestId),
      ).rejects.toThrow();
    });
  });

  describe("term published visibility", () => {
    it("admin should see coverage requests in unpublished terms", async () => {
      // The term created in beforeEach is unpublished by default
      await coverageService.createCoverageRequest(volunteer1Id, {
        shiftId,
        category: "emergency",
        details: "Need coverage",
      });

      const result = await coverageService.listCoverageRequests(
        {},
        "admin-1",
        Role.admin,
      );
      expect(result.data.length).toBeGreaterThanOrEqual(1);
    });

    it("volunteer should not see coverage requests in unpublished terms", async () => {
      await coverageService.createCoverageRequest(volunteer1Id, {
        shiftId,
        category: "emergency",
        details: "Need coverage",
      });

      const result = await coverageService.listCoverageRequests(
        {},
        volunteer1Id,
        Role.volunteer,
      );
      expect(result.data).toHaveLength(0);
    });

    it("volunteer should see coverage requests in published terms", async () => {
      // Publish the term that was created in beforeEach
      const terms = await termService.getAllTerms();
      const testTerm = terms.find((t) => createdTermIds.includes(t.id));
      if (testTerm) {
        await termService.publishTerm(testTerm.id);
      }

      await coverageService.createCoverageRequest(volunteer1Id, {
        shiftId,
        category: "emergency",
        details: "Need coverage",
      });

      const result = await coverageService.listCoverageRequests(
        {},
        volunteer1Id,
        Role.volunteer,
      );
      expect(result.data.length).toBeGreaterThanOrEqual(1);
    });
  });
});
