// hooks/use-navbar.ts
"use client";

import { useBreakpoint } from "@/hooks/use-breakpoint";
import { useOnNavChange } from "@/providers/navigate-event-provider";
import { useCallback, useLayoutEffect, useState } from "react";

export function useNavbar() {
  const mdUp = useBreakpoint("md");
  const lgUp = useBreakpoint("lg");

  const [collapsedLg, setCollapsedLg] = useState(false); // desktop only
  const [openSmall, setOpenSmall] = useState(false); // small/overlay only

  // below lg we use the overlay, at/above lg we use collapsedLg
  const collapsed = lgUp ? collapsedLg : !openSmall;

  const toggle = useCallback(() => {
    if (lgUp) setCollapsedLg(v => !v);
    else setOpenSmall(v => !v);
  }, [lgUp]);

  const close = useCallback(() => {
    if (lgUp) setCollapsedLg(true);
    else setOpenSmall(false);
  }, [lgUp]);

  // Close the small overlay after navigation
  useOnNavChange(
    useCallback(() => {
      if (!lgUp) setOpenSmall(false);
    }, [lgUp]),
  );

  // Keep the displacement in sync
  useLayoutEffect(() => {
    const root = document.documentElement;
    if (lgUp && collapsed) root.setAttribute("data-nav-collapsed-lg", "true");
    else root.removeAttribute("data-nav-collapsed-lg");
  }, [lgUp, collapsed]);

  return {
    collapsed,
    toggle,
    close,
    isMediumScreen: mdUp,
    isLargeScreen: lgUp,
  };
}
