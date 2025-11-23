"use client";

import { useBreakpoint } from "@/hooks/use-breakpoint";
import { useOnNavChange } from "@/providers/navigate-event-provider";
import { useCallback, useEffect, useState } from "react";

const DESKTOP_OPEN_PX = 308; // 19.25rem
const DESKTOP_CLOSED_PX = 80; // 5rem

const getWidthPx = (isLargeScreen: boolean, isMediumScreen: boolean, collapsed: boolean) => {
  if (isLargeScreen) return !collapsed ? DESKTOP_OPEN_PX : DESKTOP_CLOSED_PX;
  if (isMediumScreen) return DESKTOP_CLOSED_PX;
  return 0;
}

export function useNavbar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const toggle = useCallback(() => setCollapsed((v) => !v), []);
  const close = useCallback(() => setCollapsed(true), []);
  const isMediumScreen = useBreakpoint("md");

  // Track when component is mounted to avoid hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  const isLargeScreen = useBreakpoint("lg", ({ up }) => {
    // Close when moving down from large screens
    if (mounted && !up && !collapsed) toggle();
  });

  // Close when page loads on small or medium screens after mounting
  useEffect(() => {
    if (mounted && !isLargeScreen) close();
  }, [mounted, isLargeScreen, close]);

  // Close when navigating on small screen
  useOnNavChange(
    useCallback(() => {
      if (mounted && !isLargeScreen && !collapsed) close();
    }, [mounted, isLargeScreen, collapsed, close]),
  );

  // Update displacement CSS var for desktop only
  useEffect(() => {
    if (!mounted) return;
    const widthPx = getWidthPx(isLargeScreen, isMediumScreen, collapsed);
    document.documentElement.style.setProperty(
      "--navbar-displacement",
      `${widthPx}px`,
    );
  }, [mounted, isMediumScreen, isLargeScreen, collapsed]);

  return {
    collapsed,
    toggle,
    close,
    isMediumScreen,
  };
}
