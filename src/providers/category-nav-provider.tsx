"use client";

import React from "react";

type CategoryNavContext = {
  activeCategory: string | null;
  scrollToCategory: (id: string) => void;
  registerSection: (id: string, el: HTMLElement | null) => void;
};
const CategoryNavContext = React.createContext<CategoryNavContext | null>(null);

export function useCategoryNav() {
  const ctx = React.useContext(CategoryNavContext);
  if (!ctx) throw new Error("useCategoryNav must be used inside CategoryNavProvider");
  return ctx;
}

export function CategoryNavProvider({
  categories,
  scrollRef,
  children,
}: {
  categories: string[];
  scrollRef: React.RefObject<HTMLElement>;
  children: React.ReactNode;
}) {
  const [active, setActive] = React.useState<string | null>(categories[0] ?? null);
  const registry = React.useRef(new Map<string, HTMLElement>());

  const registerSection = React.useCallback((id: string, el: HTMLElement | null) => {
    if (el) registry.current.set(id, el);
    else registry.current.delete(id);
  }, []);

  const scrollToCategory = React.useCallback((id: string) => {
    const el = registry.current.get(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
  }, []);

  // scroll handler: choose the section whose top is closest to container top
  React.useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const containerTop = container.getBoundingClientRect().top;
        let closestId: string | null = null;
        let closestDist = Number.POSITIVE_INFINITY;

        registry.current.forEach((el, id) => {
          const top = el.getBoundingClientRect().top;
          const dist = Math.abs(top - containerTop);
          if (dist < closestDist) {
            closestDist = dist;
            closestId = id;
          }
        });

        if (closestId && closestId !== active) setActive(closestId);
      });
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    // run once to initialize from current scroll position
    onScroll();
    return () => container.removeEventListener("scroll", onScroll);
  }, [scrollRef, active]);

  return (
    <CategoryNavContext.Provider 
      value={{ activeCategory: active, scrollToCategory, registerSection }}
    >{children}</CategoryNavContext.Provider>
  );
}

