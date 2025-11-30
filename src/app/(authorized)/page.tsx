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
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  hasPermission,
  type Permissions,
} from "@/lib/auth/extensions/permissions";
import { Role } from "@/models/interfaces";
import { useAuth } from "@/providers/client-auth-provider";
import Link from "next/link";
import { Hammer } from "lucide-react";
import type { Route } from "next/dist/build/swc/types";
import { navbarItems } from "@/components/app-navbar";

export default function DashboardPage() {
  const { user } = useAuth();
  const accessibleLinks = user
    ? navbarItems.filter((link) =>
        hasPermission({ user, ...(link.permissions as Permissions) }),
      )
    : [];

  return (
    <>
      <PageLayout>
        <PageLayoutHeader>
          <PageLayoutHeaderContent>
            <PageLayoutHeaderTitle>Dashboard</PageLayoutHeaderTitle>
          </PageLayoutHeaderContent>
        </PageLayoutHeader>

        <PageLayoutContent>
          {user && (
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
        </PageLayoutContent>
      </PageLayout>
    </>
  );
}
