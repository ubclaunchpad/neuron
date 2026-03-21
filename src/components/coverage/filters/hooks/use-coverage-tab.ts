"use client";

import { parseAsStringEnum, useQueryState } from "nuqs";
import {
  COVERAGE_TABS,
  type CoverageTab,
} from "@/components/coverage/constants";

export function useCoverageTab() {
  return useQueryState(
    "tab",
    parseAsStringEnum<CoverageTab>([...COVERAGE_TABS]).withDefault("upcoming"),
  );
}
