import { describe, expect, it } from "vitest";
import {
  resolveEffectiveShiftVolunteers,
  type ResolvedCoverageEdge,
} from "@/server/services/entity/shiftAssignment";

describe("resolveEffectiveShiftVolunteers", () => {
  const shiftId = "shift-1";

  it("returns base volunteers when there are no resolved coverage requests", () => {
    const result = resolveEffectiveShiftVolunteers(shiftId, ["v1", "v2"], []);

    expect(result).toEqual([
      {
        shiftId,
        volunteerUserId: "v1",
        coveringForVolunteerUserId: null,
        coverageRequestId: null,
      },
      {
        shiftId,
        volunteerUserId: "v2",
        coveringForVolunteerUserId: null,
        coverageRequestId: null,
      },
    ]);
  });

  it("replaces a released base volunteer with the covering volunteer", () => {
    const coverages: ResolvedCoverageEdge[] = [
      {
        id: "cr-1",
        shiftId,
        requestedAt: new Date("2026-07-01T10:00:00Z"),
        requestingVolunteerUserId: "v1",
        coveredByVolunteerUserId: "v3",
      },
    ];

    const result = resolveEffectiveShiftVolunteers(
      shiftId,
      ["v1", "v2"],
      coverages,
    );

    expect(result).toEqual([
      {
        shiftId,
        volunteerUserId: "v2",
        coveringForVolunteerUserId: null,
        coverageRequestId: null,
      },
      {
        shiftId,
        volunteerUserId: "v3",
        coveringForVolunteerUserId: "v1",
        coverageRequestId: "cr-1",
      },
    ]);
  });

  it("resolves chained substitutions (v1 -> v2 -> v3) regardless of coverage row order", () => {
    const cr1: ResolvedCoverageEdge = {
      id: "cr-1",
      shiftId,
      requestedAt: new Date("2026-07-01T10:00:00Z"),
      requestingVolunteerUserId: "v1",
      coveredByVolunteerUserId: "v2",
    };
    const cr2: ResolvedCoverageEdge = {
      id: "cr-2",
      shiftId,
      requestedAt: new Date("2026-07-02T10:00:00Z"),
      requestingVolunteerUserId: "v2",
      coveredByVolunteerUserId: "v3",
    };

    // Pass in reverse chronological order to verify order-independence.
    const result = resolveEffectiveShiftVolunteers(shiftId, ["v1"], [cr2, cr1]);

    expect(result).toEqual([
      {
        shiftId,
        volunteerUserId: "v3",
        coveringForVolunteerUserId: "v2",
        coverageRequestId: "cr-2",
      },
    ]);
  });

  it("handles round-trip substitutions (v1 -> v2 -> v1)", () => {
    const coverages: ResolvedCoverageEdge[] = [
      {
        id: "cr-1",
        shiftId,
        requestedAt: new Date("2026-07-01T10:00:00Z"),
        requestingVolunteerUserId: "v1",
        coveredByVolunteerUserId: "v2",
      },
      {
        id: "cr-2",
        shiftId,
        requestedAt: new Date("2026-07-02T10:00:00Z"),
        requestingVolunteerUserId: "v2",
        coveredByVolunteerUserId: "v1",
      },
    ];

    const result = resolveEffectiveShiftVolunteers(shiftId, ["v1"], coverages);

    expect(result).toEqual([
      {
        shiftId,
        volunteerUserId: "v1",
        coveringForVolunteerUserId: "v2",
        coverageRequestId: "cr-2",
      },
    ]);
  });
});
