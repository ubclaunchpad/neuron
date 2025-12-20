import { StringEnum } from "@/lib/base-enum";
import { createStringEnum } from "@/utils/typeUtils";
import { z } from "zod";

export const CoverageStatusEnum = z.enum([
  "open",
  "withdrawn",
  "resolved",
] as const);
export type CoverageStatus = z.infer<typeof CoverageStatusEnum>;
export const CoverageStatus = createStringEnum(CoverageStatusEnum);

export const CoverageRequestCategoryEnum = z.enum([
  "emergency",
  "health",
  "conflict",
  "transportation",
  "other",
] as const);
export type CoverageRequestCategory = z.infer<typeof CoverageRequestCategoryEnum>;
export const CoverageRequestCategory = StringEnum.createFromType<CoverageRequestCategory>({
  emergency: "Emergency",
  health: "Health",
  conflict: "Scheduling Conflict",
  transportation: "Transportation",
  other: "Other",
});

export const CreateCoverageRequest = z.object({
  shiftId: z.uuid(),
  category: CoverageRequestCategoryEnum,
  details: z.string(),
  comments: z.string().optional(),
});
export type CreateCoverageRequest = z.infer<typeof CreateCoverageRequest>;

export const CoverageRequestIdInput = z.object({
  coverageRequestId: z.uuid(),
});
