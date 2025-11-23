"use client";

import clsx from "clsx";
import { createContext, useContext } from "react";
import "./index.scss";

import { Navbar, type NavbarItem } from "@/components/NavbarLayout/Navbar";
import { useNavbar } from "@/hooks/use-navbar";
import CloseIcon from "@public/assets/icons/close.svg";
import ClassesIcon from "@public/assets/icons/nav/classes.svg";
import CoverageIcon from "@public/assets/icons/nav/coverage.svg";
import DashboardIcon from "@public/assets/icons/nav/dashboard.svg";
import LogIcon from "@public/assets/icons/nav/log.svg";
import MemberIcon from "@public/assets/icons/nav/member.svg";
import ScheduleIcon from "@public/assets/icons/nav/schedule.svg";
import SettingsIcon from "@public/assets/icons/nav/settings.svg";

const navbarItems: NavbarItem[] = [
  {
    href: "/",
    label: "Overview",
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    icon: DashboardIcon,
  },
  {
    href: "/schedule",
    label: "Schedule",
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    icon: ScheduleIcon,
    permissions: { permission: { shifts: ["view"] } },
  },
  {
    href: "/coverage",
    label: "Coverage Requests",
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    icon: CoverageIcon,
    permissions: { permission: { coverage: ["view"] } },
  },
  {
    href: "/classes",
    label: "Classes",
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    icon: ClassesIcon,
    permissions: { permission: { classes: ["view"] } },
  },
  {
    href: "/members",
    label: "Member Management",
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    icon: MemberIcon,
    permissions: { permission: { users: ["view-volunteer"] } },
  },
  {
    href: "/logs",
    label: "Log History",
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    icon: LogIcon,
    permissions: { permission: { logs: ["view"] } },
  },
  {
    href: "/settings",
    label: "Settings",
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    icon: SettingsIcon,
  },
];

type NavbarLayoutContextValue = {
  toggle: () => void;
  close: () => void;
  collapsed: boolean;
};

const NavbarLayoutContext = createContext<NavbarLayoutContextValue | null>(
  null,
);

export function useNavbarLayout() {
  const ctx = useContext(NavbarLayoutContext);
  if (!ctx)
    throw new Error("useNavbarLayout must be used within <NavbarLayout>");
  return ctx;
}

export function NavbarLayout({ children }: { children: React.ReactNode }) {
  const { collapsed, toggle, close, isMediumScreen } = useNavbar();

  return (
    <NavbarLayoutContext.Provider value={{ toggle, close, collapsed }}>
      <div className="neuron-app">
        <nav
          className={clsx(
            "neuron-navbar-container",
            "desktop",
            collapsed && "collapsed",
          )}
        >
          <Navbar
            navbarItems={navbarItems}
            collapsed={collapsed}
            onToggle={toggle}
          />
        </nav>
        <nav
          className={clsx(
            "neuron-navbar-container",
            "small",
            (isMediumScreen || collapsed) && "collapsed",
          )}
        >
          <Navbar
            navbarItems={navbarItems}
            onToggle={toggle}
            toggleIcon={<CloseIcon />}
          />
        </nav>
        <div className="neuron-app-content">{children}</div>
      </div>
    </NavbarLayoutContext.Provider>
  );
}

NavbarLayout.displayName = "NavbarLayout";
