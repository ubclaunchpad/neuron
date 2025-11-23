"use client";

import { PageLayout } from "@/components/PageLayout";
import { PageTitle } from "@/components/PageLayout/PageHeader";
import { useAuth } from "@/providers/client-auth-provider";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <>
      <PageLayout>
        <PageLayout.Header>
          <PageTitle title="Overview">
          </PageTitle>
        </PageLayout.Header>
        <div>
          <span>Welcome back, {user?.name}</span>
        </div>
      </PageLayout>
    </>
  );
}
