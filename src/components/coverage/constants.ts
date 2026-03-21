export const COVERAGE_TABS = [
  "upcoming",
  "resolved",
  "past",
  "withdrawn",
] as const;

export type CoverageTab = (typeof COVERAGE_TABS)[number];

export const COVERAGE_TAB_LABELS: Record<CoverageTab, string> = {
  upcoming: "Upcoming",
  resolved: "Resolved",
  past: "Past",
  withdrawn: "Withdrawn",
};

export const COVERAGE_FILTERS_QUERY_KEY = "filters";
