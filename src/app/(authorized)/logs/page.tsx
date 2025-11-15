"use client";

import { PageLayout, PageLayoutHeader, PageLayoutHeaderContent, PageLayoutHeaderTitle } from "@/components/page-layout";

export default function LogsPage() {
  return (
    <>
      <PageLayout>
       <PageLayoutHeader>
          <PageLayoutHeaderContent>
            <PageLayoutHeaderTitle>
              Dashboard
            </PageLayoutHeaderTitle>
          </PageLayoutHeaderContent>
        </PageLayoutHeader>
      </PageLayout>
    </>
  );
}
