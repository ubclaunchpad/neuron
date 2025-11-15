"use client";

import { useLayoutEffect, useState } from "react";

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
export function useBreakpoint(
  size: keyof typeof screens,
  onChange?: (args: { up: boolean }) => void,
) {
  const query = `(min-width: ${screens[size]})`;
  const [matches, setMatches] = useState(false); // SSR & first client render match

  useLayoutEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches); // before first paint
    const handler = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
      onChange?.({ up: e.matches });
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query, onChange]);

  return matches;
}

