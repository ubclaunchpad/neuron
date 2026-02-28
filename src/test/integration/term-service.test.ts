import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { term } from "@/server/db/schema";
import { inArray } from "drizzle-orm";
import type { ITermService } from "@/server/services/entity/termService";
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
});
