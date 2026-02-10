export type CoverageFilterValues = {
  status?: "open" | "resolved" | "withdrawn";
  from?: Date;
  to?: Date;
  courseIds?: string[];
};
