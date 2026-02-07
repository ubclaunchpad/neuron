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
});
