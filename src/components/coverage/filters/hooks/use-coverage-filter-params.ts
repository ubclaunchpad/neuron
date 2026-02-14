"use client";

import { useFilterBarValues } from "@/components/ui/filter-bar";
import { COVERAGE_FILTERS_QUERY_KEY } from "@/components/coverage/constants";
import { useCoverageTab } from "./use-coverage-tab";

export function useCoverageFilterParams() {
  const [tab] = useCoverageTab();
  const filters = useFilterBarValues(COVERAGE_FILTERS_QUERY_KEY);

  return { tab, filters };
}
