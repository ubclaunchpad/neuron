import type { CoverageRequestDB } from "@/server/db/schema";
import type { CoverageRequestCategory, CoverageStatus } from "./api/coverage";
import { getEmbeddedVolunteer, type Volunteer } from "./volunteer";

export type CoverageRequest = {
  id: string;
  shiftId: string;
  status: CoverageStatus;
  category: CoverageRequestCategory;
  details: string;
  comments?: string;
  requestingVolunteer: Volunteer;
  coveringVolunteer?: Volunteer;
};

export function buildCoverageRequest(
  coverageDB: CoverageRequestDB,
  requestingVolunteer: Volunteer,
  coveringVolunteer?: Volunteer,
): CoverageRequest {
  return {
    id: coverageDB.id,
    shiftId: coverageDB.shiftId,
    status: coverageDB.status,
    category: coverageDB.category,
    details: coverageDB.details,
    comments: coverageDB.comments ?? undefined,
    requestingVolunteer: requestingVolunteer,
    coveringVolunteer: coveringVolunteer
  } as const;
}

export function getSingleCoverageRequest(r: CoverageRequest) {
  return {
    id: r.id,
    shiftId: r.shiftId,
    status: r.status,
    category: r.category,
    details: r.details,
    comments: r.comments,
    requestingVolunteer: getEmbeddedVolunteer(r.requestingVolunteer),
    coveringVolunteer: r.coveringVolunteer ? getEmbeddedVolunteer(r.coveringVolunteer) : undefined
  } as const;
}

export function getEmbeddedCoverageRequest(r: CoverageRequest) {
  return {
    id: r.id,
    shiftId: r.shiftId,
    status: r.status,
    requestingVolunteer: getEmbeddedVolunteer(r.requestingVolunteer),
    coveringVolunteer: r.coveringVolunteer ? getEmbeddedVolunteer(r.coveringVolunteer) : undefined
  } as const;
}

export type SingleCoverageRequest = ReturnType<typeof getSingleCoverageRequest>;
export type EmbeddedCoverageRequest = ReturnType<typeof getEmbeddedCoverageRequest>;
