"use client";

import clsx from "clsx";

import { NavProfileCard } from "@/components/NavProfileCard";
import { Button } from "@/components/primitives/button";
import { ActiveContext } from "@/components/utils/ActiveContext";
import { WithPermission } from "@/components/utils/WithPermission";
import type { Permissions } from "@/lib/auth/extensions/permissions";
import NavCloseIcon from "@public/assets/icons/nav/close.svg";
import Logo from "@public/assets/logo.svg";
import type { Route } from "next";
import type { SVGProps } from "react";
import { NavbarToggleButton } from "../NavbarToggle";
import "./index.scss";

export type NavbarItem = {
  href: Route;
  label: string;
  icon: React.ComponentType<SVGProps<SVGSVGElement>>;
  permissions?: Permissions;
};

export function Navbar({
  navbarItems,
  collapsed = false,
  toggleIcon,
  className,
}: {
  navbarItems: NavbarItem[];
  collapsed?: boolean;
  toggleIcon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("neuron-navbar", className, collapsed && "collapsed")}>
      <div className="navbar-content">
        <div className="navbar-header">
          <div className="navbar-brand">
            <Logo className="navbar-brand-icon" />
            <span className="navbar-brand-text">BC BWP</span>
          </div>
          <NavbarToggleButton className="show">
            {toggleIcon ?? <NavCloseIcon />}
          </NavbarToggleButton>
        </div>
        <nav className="navbar-nav">
          <div className="navbar-links">
            {navbarItems.map((item) => (
              <WithPermission key={item.href} permissions={item.permissions}>
                <ActiveContext href={item.href}>
                  {({ isActive }) => (
                    <Button
                      key={item.href}
                      className={clsx(
                        "navbar-link",
                        isActive && "active",
                        "ghost",
                      )}
                      href={item.href}
                    >
                      <item.icon className="navbar-link-icon" />
                      <span className="navbar-link-label">{item.label}</span>
                    </Button>
                  )}
                </ActiveContext>
              </WithPermission>
            ))}
          </div>
        </nav>
      </div>

      <div className="navbar-footer">
        <NavProfileCard collapsed={collapsed} />
      </div>
    </div>
  );
}

Navbar.displayName = "Navbar";
