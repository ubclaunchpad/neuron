import { describe, it, expect } from "vitest";
import { TRPCError } from "@trpc/server";
import {
  createAdminCaller,
  createVolunteerCaller,
  createUnauthenticatedCaller,
} from "../helpers/trpc-caller";

describe("term-router", () => {
  describe("all", () => {
    it("should return empty array when no terms exist", async () => {
      const caller = await createAdminCaller();

      const result = await caller.term.all();

      expect(result).toEqual([]);
    });

    it("should return all terms", async () => {
      const caller = await createAdminCaller();

      // Create a term
      await caller.term.create({
        name: "Fall 2024",
        startDate: "2024-09-01",
        endDate: "2024-12-15",
        holidays: [],
      });

      const result = await caller.term.all();

      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe("Fall 2024");
    });

    it("should reject unauthenticated requests", async () => {
      const caller = await createUnauthenticatedCaller();

      await expect(caller.term.all()).rejects.toThrow(TRPCError);
    });
  });

  describe("create", () => {
    it("should create a term with holidays", async () => {
      const caller = await createAdminCaller();

      const termId = await caller.term.create({
        name: "Winter 2025",
        startDate: "2025-01-06",
        endDate: "2025-04-15",
        holidays: [
          { startsOn: "2025-02-17", endsOn: "2025-02-21" },
        ],
      });

      expect(termId).toBeDefined();

      const term = await caller.term.byId({ termId });
      expect(term.name).toBe("Winter 2025");
    });

    it("should reject volunteer creating terms (no permission)", async () => {
      const caller = await createVolunteerCaller();

      await expect(
        caller.term.create({
          name: "Test Term",
          startDate: "2025-01-01",
          endDate: "2025-04-01",
          holidays: [],
        }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("delete", () => {
    it("should delete a term", async () => {
      const caller = await createAdminCaller();

      const termId = await caller.term.create({
        name: "To Delete",
        startDate: "2025-01-01",
        endDate: "2025-04-01",
        holidays: [],
      });

      await caller.term.delete({ termId });

      const terms = await caller.term.all();
      expect(terms).toHaveLength(0);
    });
  });
});
