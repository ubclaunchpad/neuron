"use client";

import { useMemo } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  FilterBar,
  FilterBarRow,
  FilterBarTrigger,
  FilterBarContent,
  FilterBarMultiSelect,
  FilterBarDateRange,
  FilterBarAdd,
  FilterBarClear,
} from "@/components/ui/filter-bar";
import { clientApi } from "@/trpc/client";
import ClassesIcon from "@public/assets/icons/nav/classes.svg";
import {
  COVERAGE_FILTERS_QUERY_KEY,
  COVERAGE_TABS,
  COVERAGE_TAB_LABELS,
  type CoverageTab,
} from "@/components/coverage/constants";
import { useCoverageTab } from "@/components/coverage/filters/hooks/use-coverage-tab";

export function CoverageFilters() {
  const [tab, setTab] = useCoverageTab();

  const { data: availableClasses } = clientApi.class.names.useQuery();

  const classOptions = useMemo(
    () => (availableClasses ?? []).map((c) => ({ label: c.name, value: c.id })),
    [availableClasses],
  );

  return (
    <FilterBar queryKey={COVERAGE_FILTERS_QUERY_KEY} className="px-9 pb-4">
      <FilterBarRow>
        <ToggleGroup
          type="single"
          variant="tab"
          size="sm"
          spacing={0.5}
          value={tab}
          onValueChange={(value) => {
            if (value) setTab(value as CoverageTab);
          }}
        >
          {COVERAGE_TABS.map((t) => (
            <ToggleGroupItem key={t} value={t} className="text-sm">
              {COVERAGE_TAB_LABELS[t]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <FilterBarTrigger />
      </FilterBarRow>

      <FilterBarContent>
        <FilterBarMultiSelect
          filterKey="classes"
          label="Class"
          icon={ClassesIcon}
          options={classOptions}
          multiple={true}
          searchPlaceholder="Search classes..."
          emptyMessage="No classes found."
        />

        <FilterBarDateRange filterKey="dateRange" label="Date Range" />

        <FilterBarAdd />
        <FilterBarClear />
      </FilterBarContent>
    </FilterBar>
  );
}
