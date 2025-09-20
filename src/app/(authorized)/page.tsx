"use client";

import { PageLayout } from "@/components/PageLayout";
import { useAuth } from "@/providers/client-auth-provider";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <>
      <PageLayout title="Overview">
        <div>
          <span>Welcome back, {user?.name}</span>
        </div>
      </PageLayout>
    </>
  );
}
