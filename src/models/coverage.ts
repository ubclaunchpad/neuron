import type { CoverageRequestDB } from "@/server/db/schema";
import type { CoverageRequestCategory, CoverageStatus } from "./api/coverage";
import type { EmbeddedShift } from "./shift";
import { getEmbeddedVolunteer, type Volunteer } from "./volunteer";

export type CoverageRequest = {
  id: string;
  shift: EmbeddedShift;
  requestedAt: Date;
  status: CoverageStatus;
  category: CoverageRequestCategory;
  details: string;
  comments?: string;
  requestingVolunteer: Volunteer;
  coveringVolunteer?: Volunteer;
};

export function buildCoverageRequest(
  coverageDB: CoverageRequestDB,
  shift: EmbeddedShift,
  requestingVolunteer: Volunteer,
  coveringVolunteer?: Volunteer,
): CoverageRequest {
  return {
    id: coverageDB.id,
    shift,
    requestedAt: coverageDB.requestedAt,
    status: coverageDB.status,
    category: coverageDB.category,
    details: coverageDB.details,
    comments: coverageDB.comments ?? undefined,
    requestingVolunteer: requestingVolunteer,
    coveringVolunteer: coveringVolunteer,
  } as const;
}

export function getSingleCoverageRequest(r: CoverageRequest) {
  return {
    id: r.id,
    shift: r.shift,
    requestedAt: r.requestedAt,
    status: r.status,
    category: r.category,
    details: r.details,
    comments: r.comments,
    requestingVolunteer: getEmbeddedVolunteer(r.requestingVolunteer),
    coveringVolunteer: r.coveringVolunteer
      ? getEmbeddedVolunteer(r.coveringVolunteer)
      : undefined,
  } as const;
}

export function getEmbeddedCoverageRequest(r: CoverageRequest) {
  return {
    id: r.id,
    shift: r.shift,
    requestedAt: r.requestedAt,
    status: r.status,
    requestingVolunteer: getEmbeddedVolunteer(r.requestingVolunteer),
    coveringVolunteer: r.coveringVolunteer
      ? getEmbeddedVolunteer(r.coveringVolunteer)
      : undefined,
  } as const;
}

export type SingleCoverageRequest = ReturnType<typeof getSingleCoverageRequest>;
export type EmbeddedCoverageRequest = ReturnType<
  typeof getEmbeddedCoverageRequest
>;

// Base list item (visible to all users who can see the request)
export function getListCoverageRequestBase(r: CoverageRequest) {
  return {
    id: r.id,
    shift: r.shift,
    requestedAt: r.requestedAt,
    status: r.status,
    requestingVolunteer: getEmbeddedVolunteer(r.requestingVolunteer),
    coveringVolunteer: r.coveringVolunteer
      ? getEmbeddedVolunteer(r.coveringVolunteer)
      : undefined,
  } as const;
}

// Admin list item (includes reason fields: category, details, comments)
export function getListCoverageRequestWithReason(r: CoverageRequest) {
  return {
    ...getListCoverageRequestBase(r),
    category: r.category,
    details: r.details,
    comments: r.comments,
  } as const;
}

export type ListCoverageRequestBase = ReturnType<
  typeof getListCoverageRequestBase
>;
export type ListCoverageRequestWithReason = ReturnType<
  typeof getListCoverageRequestWithReason
>;
