"use client";

import { Button } from "@/components/primitives/button";
import React from "react";

const ActiveSectionContext = React.createContext<{
  activeSectionId: string | null;
  scrollToSection: (sectionId: string) => void;
  registerSection: (sectionId: string, el: HTMLElement | null) => void;
  registerSectionLink: (sectionId: string, el: HTMLElement | null) => void;
} | null>(null);

export const useActiveSection = () => {
  const ctx = React.useContext(ActiveSectionContext);
  if (!ctx) throw new Error("useActiveSection must be used within a <ActiveSectionProvider>");
  return ctx;
};

export function ActiveSectionProvider({
  sectionIds,
  initialSectionId,
  scrollRef,
  children,
}: {
  sectionIds?: readonly string[];
  initialSectionId?: string;
  scrollRef: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
}) {
  const initial = initialSectionId ?? sectionIds?.[0] ?? null;
  const [active, setActive] = React.useState<string | null>(initial);
  const activeRef = React.useRef<string | null>(active);
  React.useEffect(() => {
    activeRef.current = active;
  }, [active]);

  const sectionRegistry = React.useRef(new Map<string, HTMLElement>());
  const sectionLinkRegistry = React.useRef(new Map<string, HTMLElement>());

  // When true, ignore exactly one scroll event
  const ignoreNextScroll = React.useRef(false);

  const register = React.useCallback(
    (sectionId: string, el: HTMLElement | null, registry: React.RefObject<Map<string, HTMLElement>>) => {
      if (el) {
        registry.current.set(sectionId, el);

        // If the user clicked this id before it was mounted, try to bring it into view now.
        if (sectionId === activeRef.current && ignoreNextScroll.current) {
          el.scrollIntoView({
            behavior: "auto",
            block: "start",
            inline: "nearest",
          });
        }
      } else {
        registry.current.delete(sectionId);
      }
    },
    [],
  );

  const registerSection = React.useCallback(
    (sectionId: string, el: HTMLElement | null) => register(sectionId, el, sectionRegistry),
    [register],
  );
  const registerSectionLink = React.useCallback(
    (sectionId: string, el: HTMLElement | null) => register(sectionId, el, sectionLinkRegistry),
    [register],
  );

  const scrollToSection = React.useCallback((sectionId: string) => {
    setActive(sectionId);
    ignoreNextScroll.current = true;

    const el = sectionRegistry.current.get(sectionId);
    if (el) {
      el.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });
    }

    const linkEl = sectionLinkRegistry.current.get(sectionId);
    if (linkEl) {
      linkEl.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });
    }
  }, []);

  // Scroll handler
  React.useEffect(() => {
    const container = scrollRef?.current;
    if (!container) return;

    let ticking = false;
    const onScroll = () => {
      if (ignoreNextScroll.current) {
        ignoreNextScroll.current = false;
        return;
      }

      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;

        const containerTop = container.getBoundingClientRect().top;
        let closestId: string | null = null;
        let closestDist = Number.POSITIVE_INFINITY;

        sectionRegistry.current.forEach((el, id) => {
          const dist = Math.abs(el.getBoundingClientRect().top - containerTop);
          if (dist < closestDist) {
            closestDist = dist;
            closestId = id;
          }
        });

        if (closestId && closestId !== activeRef.current) {
          setActive(closestId);
        }
      });
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    // Initialize from current position, but respect a just-clicked selection.
    onScroll();
    return () => container.removeEventListener("scroll", onScroll);
  }, [scrollRef]);

  return (
    <ActiveSectionContext.Provider
      value={{
        activeSectionId: active,
        scrollToSection,
        registerSection,
        registerSectionLink,
      }}
    >
      {children}
    </ActiveSectionContext.Provider>
  );
}

export function Section({
  sectionId,
  className,
  children,
}: {
  sectionId: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { registerSection } = useActiveSection();
  const setRef = React.useCallback(
    (node: HTMLElement | null) => registerSection(sectionId, node),
    [sectionId, registerSection],
  );

  return (
    <section
      ref={setRef}
      className={className}
      data-section-id={sectionId}
    >
      {children}
    </section>
  );
}

export function SectionLink({
  sectionId,
  className,
  children,
}: {
  sectionId: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { registerSectionLink, scrollToSection } = useActiveSection();
  const setRef = React.useCallback(
    (node: HTMLElement | null) => registerSectionLink(sectionId, node),
    [sectionId, registerSectionLink],
  );
  const scrollTo = React.useCallback(
    () => scrollToSection(sectionId),
    [sectionId, scrollToSection],
  );

  return (
    <Button
      unstyled
      ref={setRef}
      onClick={scrollTo}
      className={className}
    >
      {children}
    </Button>
  );
}
