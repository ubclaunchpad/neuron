"use client";

import { PageLayout, PageLayoutHeader, PageLayoutHeaderContent, PageLayoutHeaderLeft, PageLayoutHeaderTitle } from "@/components/page-layout";

export default function MembersPage() {
  return (
    <>
      <PageLayout>
        <PageLayoutHeader>
          <PageLayoutHeaderContent>
            <PageLayoutHeaderLeft>
              <PageLayoutHeaderTitle>
                Member Management
              </PageLayoutHeaderTitle>
            </PageLayoutHeaderLeft>
          </PageLayoutHeaderContent>
        </PageLayoutHeader>
      </PageLayout>
    </>
  );
}
