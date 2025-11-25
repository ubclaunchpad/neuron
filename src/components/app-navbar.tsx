"use client";

import type { Route } from "next";
import Link from "next/link";

import {
  Avatar
} from "@/components/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from "@/components/primitives/sidebar";

import { ActiveContext } from "@/components/utils/active-context";
import { WithPermission } from "@/components/utils/with-permission";
import type { Permissions } from "@/lib/auth/extensions/permissions";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/client-auth-provider";
import ChevronRight from "@public/assets/icons/caret-right.svg";
import CloseIcon from "@public/assets/icons/close.svg";
import ClassesIcon from "@public/assets/icons/nav/classes.svg";
import NavToggleIcon from "@public/assets/icons/nav/close.svg";
import CoverageIcon from "@public/assets/icons/nav/coverage.svg";
import DashboardIcon from "@public/assets/icons/nav/dashboard.svg";
import LogIcon from "@public/assets/icons/nav/log.svg";
import MemberIcon from "@public/assets/icons/nav/member.svg";
import ScheduleIcon from "@public/assets/icons/nav/schedule.svg";
import Logo from "@public/assets/logo.svg";
import { SettingsDropdown } from "./settings/settings-dropdown";

const navbarItems = [
  {
    href: "/",
    label: "Overview",
    icon: DashboardIcon,
  },
  {
    href: "/schedule",
    label: "Schedule",
    icon: ScheduleIcon,
    permissions: { permission: { shifts: ["view"] } },
  },
  {
    href: "/coverage",
    label: "Coverage Requests",
    icon: CoverageIcon,
    permissions: { permission: { coverage: ["view"] } },
  },
  {
    href: "/classes",
    label: "Classes",
    icon: ClassesIcon,
    permissions: { permission: { classes: ["view"] } },
  },
  {
    href: "/members",
    label: "Member Management",
    icon: MemberIcon,
    permissions: { permission: { users: ["view"] } },
  },
  {
    href: "/logs",
    label: "Log History",
    icon: LogIcon,
    permissions: { permission: { logs: ["view"] } },
  },
];

function ProfileCard() {
  const { user } = useAuth();
  const userFullname = `${user?.name} ${user?.lastName}`

  return (
    <SettingsDropdown
      className={cn(
        "flex w-full min-w-0 flex-1 items-center justify-between",
        "bg-card shadow rounded-lg",
        "p-3 transition-[padding,margin]",
        "focus-visible:ring-2 focus-visible:ring-ring/50",
        "group-data-[state=collapsed]:!p-0.5 group-data-[state=collapsed]:my-2.5 group-data-[state=collapsed]:rounded-lg",
        "group-data-[state=collapsed]:shrink-0 group-data-[state=collapsed]:gap-0 group-data-[state=collapsed]:min-w-max"
      )}
    >
      <div
        className={cn(
          "flex h-10 min-w-0 items-center gap-2",
          "group-data-[state=collapsed]:gap-0"
        )}
      >
        <Avatar
          className="size-10 shrink-0 group-data-[state=collapsed]:rounded-sm"
          src={user?.image ?? undefined}
          fallbackText={userFullname}
        />

        <div
          className={cn(
            "flex min-w-0 flex-col items-start justify-center transition-opacity duration-200",
            "group-data-[state=collapsed]:w-0 group-data-[state=collapsed]:h-0 group-data-[state=collapsed]:overflow-hidden group-data-[state=collapsed]:opacity-0"
          )}
        >
          <span className="truncate text-base text-foreground max-w-full">
            {user?.name}
          </span>
          <span className="truncate text-xs text-muted-foreground max-w-full">
            {user?.email}
          </span>
        </div>
      </div>

      <ChevronRight
        aria-hidden="true"
        className={cn(
          "size-4 transition-opacity duration-200 text-muted-foreground",
          "group-data-[state=collapsed]:size-0 group-data-[state=collapsed]:opacity-0"
        )}
      />
    </SettingsDropdown>
  );
}

export function AppNavbar() {
  const { isMobile, open, toggleSidebar } = useSidebar();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-5">
        <SidebarMenu>
          <SidebarMenuItem className="relative h-10">
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-between w-full overflow-hidden",
                "transition-opacity duration-200 ease-in-out motion-safe",
                "opacity-100 group-data-[state=collapsed]:opacity-0",
                "pointer-events-auto group-data-[state=collapsed]:pointer-events-none",
              )}
              aria-hidden={false}
            >
              <div className="inline-flex items-center gap-3">
                <Logo className="h-10 w-10 shrink-0" />
                <span className="font-light text-primary text-[1.5rem] shrink-0">BC BWP</span>
              </div>

              <div className="ml-auto">
                <SidebarMenuButton onClick={toggleSidebar} aria-label="Toggle sidebar" className="h-10">
                  {(isMobile && open)
                    ? <CloseIcon className="size-5 text-muted-foreground" />
                    : <NavToggleIcon className="size-5 text-muted-foreground" />}
                </SidebarMenuButton>
              </div>
            </div>

            <div
              className={cn(
                "absolute inset-0 flex items-center justify-end w-full overflow-hidden",
                "transition-opacity duration-200 ease-in-out motion-safe",
                "opacity-0 group-data-[state=collapsed]:opacity-100",
                "group-data-[state=collapsed]:pointer-events-auto pointer-events-none",
              )}
              aria-hidden={false}
            >
              <SidebarMenuButton onClick={toggleSidebar} aria-label="Toggle sidebar" className="h-10">
                <NavToggleIcon className="size-5 text-muted-foreground" />
              </SidebarMenuButton>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="p-5">
          <SidebarGroupContent>
            <SidebarMenu className="gap-0">
              {navbarItems.map((item) => (
                <WithPermission key={item.href} permissions={item.permissions as Permissions}>
                  <ActiveContext url={item.href}>
                    {({ isActive }) => (
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          className={cn(
                            "relative gap-3.5 h-11.4 group-data-[state=collapsed]:h-10 my-1.5 group-data-[state=collapsed]:my-[0.425rem]",
                            "overflow-visible transition-all",
                            "before:absolute before:left-[calc(-5px-1.25rem)] before:top-0 before:bottom-0  before:w-[5px] before:rounded-r-md before:bg-primary-muted before:transition-[left] data-[active=true]:before:left-[-1.25rem]",
                          )}
                        >
                          <Link href={item.href as Route}>
                            <item.icon className="size-5"/>
                            <span className="text-base truncate">{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )}
                  </ActiveContext>
                </WithPermission>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-5">
        <ProfileCard />
      </SidebarFooter>
    </Sidebar>
  );
}

AppNavbar.displayName = "AppSidebar";
