import type {
  DateRangeValue,
  FilterBarValues,
  FilterOption,
} from "@/components/ui/filter-bar";
import type { CoverageTab } from "@/components/coverage/constants";
import type { CoverageFilterValues } from "./types";

export function buildFilterInput(
  tab: CoverageTab,
  filters: FilterBarValues,
): CoverageFilterValues {
  const classes = (filters.classes ?? []) as FilterOption[];
  const dateRange = filters.dateRange as DateRangeValue | undefined;
  const courseIds = classes.map((c) => c.value);
  const input: CoverageFilterValues = {};

  switch (tab) {
    case "upcoming":
      input.status = "open";
      input.from = new Date();
      break;
    case "resolved":
      input.status = "resolved";
      break;
    case "past":
      input.to = new Date();
      break;
    case "withdrawn":
      input.status = "withdrawn";
      break;
  }

  if (dateRange?.from) input.from = new Date(dateRange.from);
  if (dateRange?.to) input.to = new Date(dateRange.to);
  if (courseIds.length > 0) input.courseIds = courseIds;

  return input;
}
