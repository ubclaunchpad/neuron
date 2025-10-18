"use client";

import {
  PageLayout,
  PageLayoutHeader,
  PageLayoutHeaderContent,
  PageLayoutHeaderLeft,
  PageLayoutHeaderTitle,
} from "@/components/page-layout";

export default function SchedulePage() {
  return (
    <>
      <PageLayout>
        <PageLayoutHeader>
          <PageLayoutHeaderContent>
            <PageLayoutHeaderLeft>
              <PageLayoutHeaderTitle>Schedule</PageLayoutHeaderTitle>
            </PageLayoutHeaderLeft>
          </PageLayoutHeaderContent>
        </PageLayoutHeader>
      </PageLayout>
    </>
  );
}
