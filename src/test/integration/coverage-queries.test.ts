import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "crypto";
import { Temporal } from "@js-temporal/polyfill";
import { eq, inArray } from "drizzle-orm";
import { course, shift, term, user, volunteer } from "@/server/db/schema";
import type { IClassService } from "@/server/services/entity/classService";
import type { ICoverageService } from "@/server/services/entity/coverageService";
import type { ITermService } from "@/server/services/entity/termService";
import {
  createTestScope,
  type ITestServiceScope,
} from "../helpers/test-service-scope";

describe("CoverageService DB queries", () => {
  let scope: ITestServiceScope;
  let coverageService: ICoverageService;
  let termService: ITermService;
  let classService: IClassService;

  let createdUserIds: string[] = [];
  let createdTermIds: string[] = [];
  let createdClassIds: string[] = [];

  let volunteer1Id: string;
  let volunteer2Id: string;
  let volunteer3Id: string;
  let instructorId: string;
  let shiftId: string;

  beforeEach(async () => {
    scope = createTestScope();
    scope.mockSession.setAsAdmin();
    coverageService = scope.resolve<ICoverageService>("coverageService");
    termService = scope.resolve<ITermService>("termService");
    classService = scope.resolve<IClassService>("classService");

    volunteer1Id = randomUUID();
    volunteer2Id = randomUUID();
    volunteer3Id = randomUUID();
    instructorId = randomUUID();

    await scope.db.insert(user).values([
      {
        id: volunteer1Id,
        name: "Vol",
        lastName: "One",
        email: `cov-q-v1-${randomUUID()}@test.com`,
        role: "volunteer",
        status: "active",
        emailVerified: true,
      },
      {
        id: volunteer2Id,
        name: "Vol",
        lastName: "Two",
        email: `cov-q-v2-${randomUUID()}@test.com`,
        role: "volunteer",
        status: "active",
        emailVerified: true,
      },
      {
        id: volunteer3Id,
        name: "Vol",
        lastName: "Three",
        email: `cov-q-v3-${randomUUID()}@test.com`,
        role: "volunteer",
        status: "active",
        emailVerified: true,
      },
      {
        id: instructorId,
        name: "Inst",
        lastName: "One",
        email: `cov-q-i1-${randomUUID()}@test.com`,
        role: "instructor",
        status: "active",
        emailVerified: true,
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

    const today = Temporal.Now.plainDateISO();
    const startDate = today.add({ days: 1 }).toString();
    const shiftDate = today.add({ days: 30 }).toString();
    const endDate = today.add({ days: 60 }).toString();

    const termId = await termService.createTerm({
      name: `Future Coverage Term ${randomUUID()}`,
      startDate,
      endDate,
      holidays: [],
    });
    createdTermIds.push(termId);
    await termService.publishTerm(termId);

    const classId = await classService.createClass({
      termId,
      name: `Future Coverage Class ${randomUUID()}`,
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
            extraDates: [shiftDate],
          },
        },
      ],
    });
    createdClassIds.push(classId);
    await classService.publishClass(classId);

    const [createdShift] = await scope.db
      .select({ id: shift.id })
      .from(shift)
      .where(eq(shift.courseId, classId));
    shiftId = createdShift!.id;
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

  it("returns numeric totals, hydrated instructors, and enforces cr2 notExists exclusion", async () => {
    const req1Id = await coverageService.createCoverageRequest(volunteer1Id, {
      shiftId,
      category: "emergency",
      details: "First volunteer out",
    });
    const req2Id = await coverageService.createCoverageRequest(volunteer2Id, {
      shiftId,
      category: "health",
      details: "Second volunteer out",
    });

    // Admin sees both requests with numeric total and instructor hydrated via getViewSelectedFields
    const adminList = await coverageService.listCoverageRequests({});
    expect(typeof adminList.total).toBe("number");
    expect(adminList.total).toBe(2);
    expect(adminList.data[0]?.shift.instructors).toHaveLength(1);
    expect(adminList.data[0]?.shift.instructors[0]?.id).toBe(instructorId);

    // Volunteer 3 is not assigned yet -> sees both open requests
    scope.mockSession.setAsVolunteer({ id: volunteer3Id });
    const beforeFill = await coverageService.listCoverageRequests({
      status: "open",
    });
    expect(typeof beforeFill.total).toBe("number");
    expect(beforeFill.data.map((r) => r.id).sort()).toEqual(
      [req1Id, req2Id].sort(),
    );

    // Volunteer 3 fills req1 -> aliased cr2 notExists excludes req2 (another open request on same shift)
    await coverageService.fulfillCoverageRequest(volunteer3Id, req1Id);
    const afterFillOpen = await coverageService.listCoverageRequests({
      status: "open",
    });
    expect(afterFillOpen.data).toEqual([]);
    expect(afterFillOpen.total).toBe(0);

    // Volunteer 3 still sees req1 (the request they are covering)
    const afterFillAll = await coverageService.listCoverageRequests({});
    expect(afterFillAll.data.map((r) => r.id)).toEqual([req1Id]);
    expect(typeof afterFillAll.total).toBe("number");
    expect(afterFillAll.total).toBe(1);
  });

  it("returns an empty array for getCoverageRequestByIds([])", async () => {
    await expect(coverageService.getCoverageRequestByIds([])).resolves.toEqual(
      [],
    );
  });
});
