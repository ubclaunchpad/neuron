"use client";

import { CoverageListView } from "@/components/coverage/coverage-list-view";
import { CoverageFilters } from "@/components/coverage/coverage-filters";
import {
  PageLayout,
  PageLayoutAside,
  PageLayoutContent,
  PageLayoutHeader,
  PageLayoutHeaderContent,
  PageLayoutHeaderTitle,
} from "@/components/page-layout";
import { Suspense } from "react";
import { CoveragePageProvider } from "@/components/coverage/coverage-page-context";
import { CoverageAside } from "@/components/coverage/coverage-aside";

export default function CoveragePage() {
  return (
    <PageLayout>
      <CoveragePageProvider>
        <PageLayoutAside>
          <Suspense fallback={<>Loading coverage...</>}>
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
