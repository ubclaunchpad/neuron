import { course, term, user, volunteer } from "@/server/db/schema";
import type { IClassService } from "@/server/services/entity/classService";
import type { ITermService } from "@/server/services/entity/termService";
import type { IUserService } from "@/server/services/entity/userService";
import type { IVolunteerService } from "@/server/services/entity/volunteerService";
import { Temporal } from "@js-temporal/polyfill";
import { randomUUID } from "crypto";
import { eq, inArray } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createTestScope,
  type ITestServiceScope,
} from "../helpers/test-service-scope";

const makeOrderedUuid = (index: number) =>
  `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`;

describe("Search similarity and deterministic pagination", () => {
  let scope: ITestServiceScope;
  let userService: IUserService;
  let volunteerService: IVolunteerService;
  let classService: IClassService;
  let termService: ITermService;

  let createdUserIds: string[] = [];
  let createdTermIds: string[] = [];
  let createdClassIds: string[] = [];

  beforeEach(() => {
    scope = createTestScope();
    scope.mockSession.setAsAdmin();
    userService = scope.resolve<IUserService>("userService");
    volunteerService = scope.resolve<IVolunteerService>("volunteerService");
    classService = scope.resolve<IClassService>("classService");
    termService = scope.resolve<ITermService>("termService");
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

  async function seedUsers(
    records: Array<{
      id: string;
      name: string;
      lastName: string;
      email: string;
      role?: "admin" | "volunteer" | "instructor";
      status?: "active" | "inactive" | "unverified" | "rejected";
      createVolunteerProfile?: boolean;
    }>,
  ) {
    const now = new Date();
    await scope.db.insert(user).values(
      records.map((r) => ({
        id: r.id,
        name: r.name,
        lastName: r.lastName,
        email: r.email,
        role: r.role ?? "volunteer",
        status: r.status ?? "active",
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      })),
    );
    createdUserIds.push(...records.map((r) => r.id));

    const volunteerRows = records
      .filter((r) => r.createVolunteerProfile)
      .map((r) => ({ userId: r.id }));
    if (volunteerRows.length > 0) {
      await scope.db.insert(volunteer).values(volunteerRows);
    }
  }

  describe("UserService.getUsersForRequest", () => {
    it("does not double-count the first similarity column relative to later columns", async () => {
      const partialFirstNameId = makeOrderedUuid(1);
      const exactLastNameId = makeOrderedUuid(2);

      // With query "quentin":
      // - "quenti" has pg_trgm similarity ~0.625 with "quentin" (double-counted would be ~1.25 > 1.0)
      // - "quentin" has pg_trgm similarity 1.0 with "quentin"
      await seedUsers([
        {
          id: partialFirstNameId,
          name: "quenti",
          lastName: "zzzzzz",
          email: "one@example.org",
          role: "admin",
        },
        {
          id: exactLastNameId,
          name: "zzzzzz",
          lastName: "quentin",
          email: "two@example.org",
          role: "admin",
        },
      ]);

      const result = await userService.getUsersForRequest({
        search: "quentin",
        perPage: 10,
      });

      expect(result.data.map((u) => u.id)).toEqual([
        exactLastNameId,
        partialFirstNameId,
      ]);
    });

    it("breaks equal similarity scores deterministically by user id and pages without repeats or skips", async () => {
      // Lower ID matches on lastName, higher IDs match on name or identical fields:
      // All 5 have identical total similarity (1.0 + 0 + 0 = 1.0) for query "quentin"
      const ids = [
        makeOrderedUuid(10),
        makeOrderedUuid(20),
        makeOrderedUuid(30),
        makeOrderedUuid(40),
        makeOrderedUuid(50),
      ];

      // Insert in scrambled order to ensure ordering does not rely on physical heap order
      await seedUsers([
        {
          id: ids[3]!,
          name: "quentin",
          lastName: "xxxxxx",
          email: "d@example.org",
          role: "instructor",
        },
        {
          id: ids[0]!,
          name: "xxxxxx",
          lastName: "quentin",
          email: "a@example.org",
          role: "instructor",
        },
        {
          id: ids[4]!,
          name: "quentin",
          lastName: "yyyyyy",
          email: "e@example.org",
          role: "instructor",
        },
        {
          id: ids[1]!,
          name: "quentin",
          lastName: "zzzzzz",
          email: "b@example.org",
          role: "instructor",
        },
        {
          id: ids[2]!,
          name: "zzzzzz",
          lastName: "quentin",
          email: "c@example.org",
          role: "instructor",
        },
      ]);

      // Disturb physical tuple order via an update on one row
      await scope.db
        .update(user)
        .set({ updatedAt: new Date(Date.now() + 1000) })
        .where(eq(user.id, ids[0]!));

      const collected: string[] = [];
      let cursor: number | null | undefined = undefined;
      let pages = 0;

      do {
        const page = await userService.getUsersForRequest({
          search: "quentin",
          rolesToInclude: ["instructor"],
          perPage: 2,
          cursor,
        });
        collected.push(...page.data.map((u) => u.id));
        cursor = page.nextCursor;
        pages += 1;
      } while (cursor !== null && cursor !== undefined && pages < 10);

      expect(pages).toBe(3);
      expect(collected).toEqual(ids);
      expect(new Set(collected).size).toBe(ids.length);
    });

    it("pages a static dataset deterministically without search (including name ties) without repeats or skips", async () => {
      const id1 = makeOrderedUuid(101);
      const id2 = makeOrderedUuid(102);
      const id3 = makeOrderedUuid(103);
      const id4 = makeOrderedUuid(104);
      const id5 = makeOrderedUuid(105);

      // Insert out of order, including three users sharing identical (lastName, name)
      await seedUsers([
        {
          id: id5,
          name: "Alice",
          lastName: "Zeta",
          email: "zeta@example.org",
          role: "admin",
        },
        {
          id: id3,
          name: "Bob",
          lastName: "Alpha",
          email: "alpha3@example.org",
          role: "admin",
        },
        {
          id: id2,
          name: "Bob",
          lastName: "Alpha",
          email: "alpha2@example.org",
          role: "admin",
        },
        {
          id: id4,
          name: "Bob",
          lastName: "Alpha",
          email: "alpha4@example.org",
          role: "admin",
        },
        {
          id: id1,
          name: "Aaron",
          lastName: "Alpha",
          email: "alpha1@example.org",
          role: "admin",
        },
      ]);

      // Disturb physical heap order by updating an early row
      await scope.db
        .update(user)
        .set({ updatedAt: new Date(Date.now() + 1000) })
        .where(eq(user.id, id1));

      const collected: string[] = [];
      let cursor: number | null | undefined = undefined;
      let pages = 0;

      do {
        const page = await userService.getUsersForRequest({
          rolesToInclude: ["admin"],
          perPage: 2,
          cursor,
        });
        collected.push(...page.data.map((u) => u.id));
        cursor = page.nextCursor;
        pages += 1;
      } while (cursor !== null && cursor !== undefined && pages < 10);

      expect(pages).toBe(3);
      expect(collected).toEqual([id1, id2, id3, id4, id5]);
      expect(new Set(collected).size).toBe(5);
    });
  });

  describe("VolunteerService.getVolunteersForRequest and getVolunteersForExport", () => {
    it("does not double-count the first similarity column when searching volunteers", async () => {
      const partialFirstNameId = makeOrderedUuid(201);
      const exactLastNameId = makeOrderedUuid(202);

      await seedUsers([
        {
          id: partialFirstNameId,
          name: "quenti",
          lastName: "zzzzzz",
          email: "v1@example.org",
          role: "volunteer",
          createVolunteerProfile: true,
        },
        {
          id: exactLastNameId,
          name: "zzzzzz",
          lastName: "quentin",
          email: "v2@example.org",
          role: "volunteer",
          createVolunteerProfile: true,
        },
      ]);

      const listResult = await volunteerService.getVolunteersForRequest({
        search: "quentin",
        perPage: 10,
      });
      expect(listResult.data.map((v) => v.id)).toEqual([
        exactLastNameId,
        partialFirstNameId,
      ]);

      const exportResult =
        await volunteerService.getVolunteersForExport("quentin");
      expect(exportResult.map((v) => v.id)).toEqual([
        exactLastNameId,
        partialFirstNameId,
      ]);
    });

    it("breaks equal similarity scores by id and pages volunteer search without repeats or skips", async () => {
      const ids = [
        makeOrderedUuid(210),
        makeOrderedUuid(220),
        makeOrderedUuid(230),
        makeOrderedUuid(240),
        makeOrderedUuid(250),
      ];

      await seedUsers([
        {
          id: ids[4]!,
          name: "quentin",
          lastName: "aaaaaa",
          email: "ve@example.org",
          role: "volunteer",
          createVolunteerProfile: true,
        },
        {
          id: ids[1]!,
          name: "quentin",
          lastName: "bbbbbb",
          email: "vb@example.org",
          role: "volunteer",
          createVolunteerProfile: true,
        },
        {
          id: ids[0]!,
          name: "cccccc",
          lastName: "quentin",
          email: "va@example.org",
          role: "volunteer",
          createVolunteerProfile: true,
        },
        {
          id: ids[3]!,
          name: "dddddd",
          lastName: "quentin",
          email: "vd@example.org",
          role: "volunteer",
          createVolunteerProfile: true,
        },
        {
          id: ids[2]!,
          name: "quentin",
          lastName: "eeeeee",
          email: "vc@example.org",
          role: "volunteer",
          createVolunteerProfile: true,
        },
      ]);

      const collected: string[] = [];
      let cursor: number | null | undefined = undefined;
      let pages = 0;

      do {
        const page = await volunteerService.getVolunteersForRequest({
          search: "quentin",
          perPage: 2,
          cursor,
        });
        collected.push(...page.data.map((v) => v.id));
        cursor = page.nextCursor;
        pages += 1;
      } while (cursor !== null && cursor !== undefined && pages < 10);

      expect(pages).toBe(3);
      expect(collected).toEqual(ids);
      expect(new Set(collected).size).toBe(ids.length);

      const exported = await volunteerService.getVolunteersForExport("quentin");
      expect(exported.map((v) => v.id)).toEqual(ids);
    });

    it("pages static volunteer listings deterministically without search (including name ties)", async () => {
      const id1 = makeOrderedUuid(301);
      const id2 = makeOrderedUuid(302);
      const id3 = makeOrderedUuid(303);
      const id4 = makeOrderedUuid(304);
      const id5 = makeOrderedUuid(305);

      await seedUsers([
        {
          id: id5,
          name: "Zoe",
          lastName: "Zeta",
          email: "vz@example.org",
          role: "volunteer",
          createVolunteerProfile: true,
        },
        {
          id: id3,
          name: "Sam",
          lastName: "Alpha",
          email: "vs3@example.org",
          role: "volunteer",
          createVolunteerProfile: true,
        },
        {
          id: id2,
          name: "Sam",
          lastName: "Alpha",
          email: "vs2@example.org",
          role: "volunteer",
          createVolunteerProfile: true,
        },
        {
          id: id4,
          name: "Sam",
          lastName: "Alpha",
          email: "vs4@example.org",
          role: "volunteer",
          createVolunteerProfile: true,
        },
        {
          id: id1,
          name: "Amy",
          lastName: "Alpha",
          email: "va1@example.org",
          role: "volunteer",
          createVolunteerProfile: true,
        },
      ]);

      await scope.db
        .update(user)
        .set({ updatedAt: new Date(Date.now() + 1000) })
        .where(eq(user.id, id2));

      const collected: string[] = [];
      let cursor: number | null | undefined = undefined;
      let pages = 0;

      do {
        const page = await volunteerService.getVolunteersForRequest({
          perPage: 2,
          cursor,
        });
        collected.push(...page.data.map((v) => v.id));
        cursor = page.nextCursor;
        pages += 1;
      } while (cursor !== null && cursor !== undefined && pages < 10);

      expect(pages).toBe(3);
      expect(collected).toEqual([id1, id2, id3, id4, id5]);
      expect(new Set(collected).size).toBe(5);

      const exported = await volunteerService.getVolunteersForExport();
      expect(exported.map((v) => v.id)).toEqual([id1, id2, id3, id4, id5]);
    });
  });

  describe("ClassService.retrieveFullClasses pagination", () => {
    it("pages classes deterministically by id without repeats or skips", async () => {
      const volunteerId = randomUUID();
      const instructorId = randomUUID();

      await seedUsers([
        {
          id: volunteerId,
          name: "Vol",
          lastName: "One",
          email: `vol-${randomUUID()}@example.org`,
          role: "volunteer",
          createVolunteerProfile: true,
        },
        {
          id: instructorId,
          name: "Inst",
          lastName: "One",
          email: `inst-${randomUUID()}@example.org`,
          role: "instructor",
        },
      ]);

      const termId = await termService.createTerm({
        name: `Pagination Term ${randomUUID()}`,
        startDate: "2026-06-01",
        endDate: "2026-08-31",
        holidays: [],
      });
      createdTermIds.push(termId);
      await termService.publishTerm(termId);

      const classIds: string[] = [];
      for (let i = 0; i < 5; i++) {
        const id = await classService.createClass({
          termId,
          name: `Class ${i}`,
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
        createdClassIds.push(id);
        classIds.push(id);
      }

      // Disturb heap order by updating one course row
      await scope.db
        .update(course)
        .set({ description: "updated for heap order shuffle" })
        .where(eq(course.id, classIds[0]!));

      const expectedSortedIds = [...classIds].sort();
      const collected: string[] = [];

      for (let offset = 0; offset < expectedSortedIds.length; offset += 2) {
        const page = await classService.retrieveFullClasses({
          where: eq(course.termId, termId),
          limit: 2,
          offset,
        });
        collected.push(...page.map((c) => c.id));
      }

      expect(collected).toEqual(expectedSortedIds);
      expect(new Set(collected).size).toBe(expectedSortedIds.length);
    });
  });
});
