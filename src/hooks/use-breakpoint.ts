"use client";

import { useEffect, useState } from "react";

const screens = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
};

/**
 * Checks whether a particular viewport size applies.
 *
 * @param size The size to check, which must either be included in the screens object
 * @param onChange Optional callback to call when the breakpoint changes
 *
 * @returns A boolean indicating whether the viewport size applies.
 */
export const useBreakpoint = (
  size: "sm" | "md" | "lg" | "xl" | "2xl",
  onChange?: (args: { up: boolean }) => void,
) => {
  // IMPORTANT: start with a stable default so SSR and the first client render match.
  const [matches, setMatches] = useState(true);

  useEffect(() => {
    const breakpoint = window.matchMedia(`(min-width: ${screens[size]})`);

    setMatches(breakpoint.matches);

    const handleChange = (value: MediaQueryListEvent) => {
      setMatches(value.matches);
      if (onChange) onChange({ up: value.matches });
    };

    breakpoint.addEventListener("change", handleChange);
    return () => breakpoint.removeEventListener("change", handleChange);
  }, [size, onChange]);

  return matches;
};
