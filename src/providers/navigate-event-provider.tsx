"use client";

import {
  type ReadonlyURLSearchParams,
  usePathname,
  useSearchParams,
} from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type PropsWithChildren,
} from "react";

export type NavState = {
  /** e.g. "/dashboard?tab=stats" */
  url: string;
  /** e.g. "/dashboard" */
  pathname: string;
  /** e.g. "tab=stats" (no leading "?") */
  search: string;
  /** Next.js URLSearchParams wrapper (readonly) */
  searchParams: ReadonlyURLSearchParams | null;
};

export type NavChange = {
  current: NavState;
  previous: NavState | null;
  reason: "route";
};

type NavListener = (change: NavChange) => void;

type NavContextValue = NavState & {
  /** Subscribe to nav changes. Returns an unsubscribe function. */
  subscribe: (listener: NavListener) => () => void;
};

const NavContext = createContext<NavContextValue | null>(null);

export type NavProviderProps = PropsWithChildren<{
  /**
   * What counts as a “change”?
   * - "path"        → only when pathname changes
   * - "path+search" → pathname or querystring changes (default)
   */
  track?: "path" | "path+search";
  /** Fire the first event on initial mount? Default: false */
  fireInitial?: boolean;
}>;

export function NavigateEventProvider({
  children,
  track = "path+search",
  fireInitial = false,
}: NavProviderProps) {
  const pathname = usePathname() || "";
  const searchParams = useSearchParams(); // stable, but compare by .toString()
  const search = searchParams?.toString() ?? "";
  const url = pathname + (search ? `?${search}` : "");

  // listeners and last state are kept in refs so they don't change identity
  const listenersRef = useRef<Set<NavListener>>(new Set());
  const lastRef = useRef<NavState | null>(null);
  const first = useRef(true);

  const subscribe = useCallback((listener: NavListener) => {
    listenersRef.current.add(listener);
    return () => listenersRef.current.delete(listener);
  }, []);

  const value = useMemo<NavContextValue>(
    () => ({
      url,
      pathname,
      search,
      searchParams: searchParams ?? null,
      subscribe,
    }),
    [url, pathname, search, searchParams, subscribe],
  );

  // Build a single dep key based on the chosen tracking mode
  const depKey = track === "path" ? pathname : url;

  useEffect(() => {
    const current: NavState = {
      url,
      pathname,
      search,
      searchParams: searchParams ?? null,
    };

    if (first.current && !fireInitial) {
      first.current = false;
      lastRef.current = current;
      return;
    }
    first.current = false;

    const previous = lastRef.current;
    const change: NavChange = { current, previous, reason: "route" };

    // notify listeners
    for (const fn of listenersRef.current) {
      try {
        fn(change);
      } catch (err) {
        // keep other listeners running even if one throws
        console.error("[NavProvider] listener error:", err);
      }
    }
    lastRef.current = current;
  }, [depKey, fireInitial, pathname, search, searchParams, url, track]);

  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}

/** Read the current nav state (url, pathname, search, searchParams) and the subscribe API. */
export function useNav() {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error("useNav must be used within <NavProvider>");
  return ctx;
}

/**
 * Convenience hook to run a callback on nav changes.
 * The callback receives { current, previous, reason }.
 */
export function useOnNavChange(callback: (c: NavChange) => void) {
  const { subscribe } = useNav();
  useEffect(() => subscribe(callback), [subscribe, callback]);
}
