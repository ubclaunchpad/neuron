"use client";

import {
  PageLayout,
  PageLayoutContent,
  PageLayoutHeader,
  PageLayoutHeaderContent,
  PageLayoutHeaderTitle,
} from "@/components/page-layout";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Role } from "@/models/interfaces";
import { useAuth } from "@/providers/client-auth-provider";
import { Hammer } from "lucide-react";
import { DashboardUpcomingShifts } from "@/components/dashboard/dashboard-upcoming-shifts";
import { DashboardCoverageShifts } from "@/components/dashboard/dashboard-coverage-shifts";
import { DashboardCheckInWidget } from "@/components/dashboard/dashboard-checkin-widget";

function VolunteerDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:grid-rows-[auto_auto]">
      <div className="md:row-span-2">
        <DashboardUpcomingShifts />
      </div>
      <div className="flex flex-col gap-4">
        <DashboardCoverageShifts />
        <DashboardCheckInWidget />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <PageLayout>
      <PageLayoutHeader>
        <PageLayoutHeaderContent>
          <PageLayoutHeaderTitle>Dashboard</PageLayoutHeaderTitle>
        </PageLayoutHeaderContent>
      </PageLayoutHeader>

      <PageLayoutContent>
        <div className="p-9">
          {user?.role === Role.volunteer ? (
            <VolunteerDashboard />
          ) : user && (
            <Empty className="m-9">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Hammer className="size-6" />
                </EmptyMedia>
                <EmptyTitle>Welcome back, {user.name}!</EmptyTitle>
                <EmptyDescription>
                  The {Role.getName(user.role)} dashboard is still under
                  construction.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </div>
      </PageLayoutContent>
    </PageLayout>
  );
}