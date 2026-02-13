import type { ListCoverageRequestsInput } from "@/models/api/coverage";

export type CoverageFilterValues = Omit<
  ListCoverageRequestsInput,
  "perPage" | "cursor"
>;
