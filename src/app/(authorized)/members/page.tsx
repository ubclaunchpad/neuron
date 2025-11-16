"use client";

import { PageLayout, PageLayoutHeader, PageLayoutHeaderContent, PageLayoutHeaderTitle } from "@/components/page-layout";

export default function MembersPage() {
  return (
    <>
      <PageLayout>
        <PageLayoutHeader>
          <PageLayoutHeaderContent>
            <PageLayoutHeaderTitle>
              Member Management
            </PageLayoutHeaderTitle>
          </PageLayoutHeaderContent>
        </PageLayoutHeader>
      </PageLayout>
    </>
  );
}
