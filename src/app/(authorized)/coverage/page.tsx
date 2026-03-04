"use client";

import { CoverageListView } from "@/components/coverage/list/coverage-list-view";
import { CoverageFilters } from "@/components/coverage/filters/coverage-filters";
import {
  PageLayout,
  PageLayoutAside,
  PageLayoutContent,
  PageLayoutHeader,
  PageLayoutHeaderContent,
  PageLayoutHeaderTitle,
} from "@/components/page-layout";
import { Suspense } from "react";
import { CoveragePageProvider } from "@/components/coverage/list/coverage-page-context";
import { CoverageAside } from "@/components/coverage/list/coverage-aside";
import { SkeletonAside } from "@/components/ui/skeleton";
import { parseAsString, useQueryState } from "nuqs";

export default function CoveragePage() {
  const [coverageId, setCoverageId] = useQueryState(
    "coverageId",
    parseAsString,
  );

  return (
    <PageLayout
      open={!!coverageId}
      onOpenChange={(open) => {
        if (!open) setCoverageId(null);
      }}
    >
      <CoveragePageProvider
        coverageId={coverageId}
        setCoverageId={setCoverageId}
      >
        <PageLayoutAside>
          <Suspense fallback={<SkeletonAside />}>
            <CoverageAside />
          </Suspense>
        </PageLayoutAside>

        <PageLayoutHeader hideShadow border="always">
          <PageLayoutHeaderContent>
            <PageLayoutHeaderTitle>Coverage Requests</PageLayoutHeaderTitle>
          </PageLayoutHeaderContent>
          <CoverageFilters />
        </PageLayoutHeader>

        <PageLayoutContent className="px-6">
          <CoverageListView />
        </PageLayoutContent>
      </CoveragePageProvider>
    </PageLayout>
  );
}
