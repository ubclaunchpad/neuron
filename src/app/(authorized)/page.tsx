"use client";

import { PageLayout, PageLayoutContent, PageLayoutHeader, PageLayoutHeaderContent, PageLayoutHeaderLeft, PageLayoutHeaderTitle } from "@/components/page-layout";
import { AvailabilityInput } from "@/components/profile/availability-input";
import { useAuth } from "@/providers/client-auth-provider";

export default function DashboardPage() {
  const { user } = useAuth();

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

        <PageLayoutContent>
          <div>
            <span>Welcome back, {user?.name}</span>
          </div>

          <AvailabilityInput
            availability={"0".repeat(140)}
            editable
            className="m-4"
          ></AvailabilityInput>
          </PageLayoutContent>
      </PageLayout>
    </>
  );
}