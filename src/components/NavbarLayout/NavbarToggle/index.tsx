"use client";

import clsx from "clsx";
import { type ComponentProps } from "react";
import "./index.scss";

import { useNavbarLayout } from "@/components/NavbarLayout";
import { Button } from "@/components/primitives/button";
import BarsIcon from "@public/assets/icons/bars.svg";
import { type Button as AriaButton } from "react-aria-components";

export function NavbarToggleButton({
  className,
  children,
  ...props
}: Omit<ComponentProps<typeof AriaButton>, "onPress">) {
  const { toggle, collapsed } = useNavbarLayout();
  return (
    <Button
      className={clsx("navbar-toggle ghost small icon-only", className)}
      aria-label={
        props["aria-label"] ??
        (!collapsed ? "Collapse navigation" : "Expand navigation")
      }
      onPress={toggle}
      {...props}
    >
      {children ?? <BarsIcon />}
    </Button>
  );
}

NavbarToggleButton.displayName = "NavbarToggleButton";
