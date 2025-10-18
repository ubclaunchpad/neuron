"use client";

import { PageLayout, PageLayoutHeader, PageLayoutHeaderContent, PageLayoutHeaderLeft, PageLayoutHeaderTitle } from "@/components/page-layout";

export default function LogsPage() {
  return (
    <>
      <PageLayout>
       <PageLayoutHeader>
          <PageLayoutHeaderContent>
            <PageLayoutHeaderLeft>
              <PageLayoutHeaderTitle>
                Dashboard
              </PageLayoutHeaderTitle>
            </PageLayoutHeaderLeft>
          </PageLayoutHeaderContent>
        </PageLayoutHeader>
      </PageLayout>
    </>
  );
}
