import {
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useRef,
} from "react";

type ScrollspyProps = {
  children: ReactNode;
  targetRef?: RefObject<
    HTMLElement | HTMLDivElement | Document | null | undefined
  >;
  onUpdate?: (id: string) => void;
  offset?: number;
  smooth?: boolean;
  className?: string;
  dataAttribute?: string;
  throttleTime?: number;
};

export function Scrollspy({
  children,
  targetRef,
  onUpdate,
  className,
  offset = 0,
  smooth = true,
  dataAttribute = "scrollspy",
  throttleTime = 200,
}: ScrollspyProps) {
  const selfRef = useRef<HTMLDivElement | null>(null);
  const anchorElementsRef = useRef<HTMLElement[]>([]);
  const isProgrammaticScrollRef = useRef(false);
  const programmaticTimeoutRef = useRef<number | null>(null);

  const getScrollElement = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (!targetRef?.current || targetRef.current === document) return window;
    return targetRef.current;
  }, [targetRef]);

  const updateActiveFromSectionId = useCallback(
    (sectionId: string | null) => {
      if (!sectionId) {
        anchorElementsRef.current.forEach((item) =>
          item.removeAttribute("data-active"),
        );
        return;
      }

      anchorElementsRef.current.forEach((item) => {
        const anchorId = item.getAttribute(`data-${dataAttribute}-anchor`);
        if (anchorId === sectionId) {
          item.setAttribute("data-active", "true");
        } else {
          item.removeAttribute("data-active");
        }
      });

      onUpdate?.(sectionId);
    },
    [dataAttribute, onUpdate],
  );

  const setFragment = useCallback(
    (sectionId: string) => {
      if (typeof window === "undefined") return;

      const newHash = `#${sectionId}`;
      if (window.location.hash !== newHash) {
        window.history.replaceState({}, "", newHash);
      }

      updateActiveFromSectionId(sectionId);
    },
    [updateActiveFromSectionId],
  );

  const getSections = useCallback(() => {
    if (typeof document === "undefined") return [];

    const scrollElement = getScrollElement();
    if (!scrollElement) return [];

    const container =
      scrollElement === window || scrollElement === document
        ? document
        : (scrollElement as HTMLElement);

    const sections: { id: string; element: HTMLElement }[] = [];
    anchorElementsRef.current.forEach((anchor) => {
      const id = anchor.getAttribute(`data-${dataAttribute}-anchor`);
      if (!id) return;

      const sectionElement = container.querySelector<HTMLElement>(`#${id}`);
      if (sectionElement) {
        sections.push({ id, element: sectionElement });
      }
    });

    return sections;
  }, [dataAttribute, getScrollElement]);

  const getMostVisibleSectionId = useCallback(() => {
    if (typeof window === "undefined") return null;

    const sections = getSections();
    if (!sections.length) return null;

    const scrollElement = getScrollElement();
    if (!scrollElement) return null;

    const rootRect =
      scrollElement === window
        ? { top: 0, bottom: window.innerHeight }
        : (scrollElement as HTMLElement).getBoundingClientRect();

    let bestId: string | null = null;
    let bestVisible = 0;

    for (const { id, element } of sections) {
      const rect = element.getBoundingClientRect();
      const top = Math.max(rect.top, rootRect.top);
      const bottom = Math.min(rect.bottom, rootRect.bottom);
      const visible = bottom - top;

      if (visible > bestVisible + 1) {
        bestVisible = visible;
        bestId = id;
      }
    }

    // if nothing had positive visible height, just take the first section.
    if (!bestId && sections.length > 0) {
      bestId = sections[0]?.id ?? null;
    }

    return bestId;
  }, [getScrollElement, getSections]);

  const scheduleProgrammaticScrollEnd = useCallback(() => {
    if (typeof window === "undefined") return;

    const delay = Math.max(throttleTime * 2, 300);
    isProgrammaticScrollRef.current = true;

    if (programmaticTimeoutRef.current != null) {
      window.clearTimeout(programmaticTimeoutRef.current);
    }

    programmaticTimeoutRef.current = window.setTimeout(() => {
      isProgrammaticScrollRef.current = false;
      programmaticTimeoutRef.current = null;

      const id = window.location.hash.replace("#", "") || null;
      if (id) {
        updateActiveFromSectionId(id);
      }
    }, delay) as unknown as number;
  }, [throttleTime, updateActiveFromSectionId]);

  const scrollToSection = useCallback(
    (sectionId: string, anchorElement?: HTMLElement) => {
      if (typeof window === "undefined") return;

      const scrollElement = getScrollElement();
      if (!scrollElement) return;

      const sectionElement = document.getElementById(sectionId);
      if (!sectionElement) return;

      anchorElement?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
      sectionElement?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
    },
    [dataAttribute, getScrollElement, offset, smooth],
  );

  const handleScrollCore = useCallback(() => {
    if (typeof window === "undefined") return;
    if (isProgrammaticScrollRef.current) return;

    const newId = getMostVisibleSectionId();
    if (!newId) return;

    const currentHashId = window.location.hash.replace("#", "");
    if (currentHashId === newId) return;

    setFragment(newId);
  }, [getMostVisibleSectionId, setFragment]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined")
      return;
    if (!selfRef.current) return;

    anchorElementsRef.current = Array.from(
      selfRef.current.querySelectorAll<HTMLElement>(
        `[data-${dataAttribute}-anchor]`,
      ),
    );

    const container = selfRef.current;

    const handleClick = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const anchor = target.closest<HTMLElement>(
        `[data-${dataAttribute}-anchor]`,
      );
      if (!anchor) return;

      event.preventDefault();

      const id = anchor.getAttribute(`data-${dataAttribute}-anchor`);
      if (!id) return;

      // URL fragment is the source of truth
      const newHash = `#${id}`;
      if (window.location.hash !== newHash) {
        window.history.replaceState({}, "", newHash);
      }

      updateActiveFromSectionId(id);
      scheduleProgrammaticScrollEnd();
      scrollToSection(id, anchor);
    };

    container.addEventListener("click", handleClick);

    const scrollElement = getScrollElement();
    const sections = getSections();

    let initialId: string | null = null;
    const rawHash = window.location.hash.replace("#", "") || null;

    // If URL has a hash and we have an anchor for it, use that as the active id
    if (rawHash) {
      const hasAnchor = anchorElementsRef.current.some(
        (a) => a.getAttribute(`data-${dataAttribute}-anchor`) === rawHash,
      );
      if (hasAnchor) {
        initialId = rawHash;
      }
    }

    // If no hash-based id, but we have sections in the scroll container:
    if (!initialId && sections.length > 0) {
      const mostVisible = getMostVisibleSectionId();
      initialId = mostVisible ?? sections[0]?.id ?? null;

      // Set default fragment only if there was no hash already
      if (initialId && !rawHash) {
        window.history.replaceState({}, "", `#${initialId}`);
      }
    }

    // If we still don't have an id and no sections exist in the scroll ref,
    // fall back to the first anchor inside the Scrollspy itself.
    if (
      !initialId &&
      sections.length === 0 &&
      anchorElementsRef.current.length > 0
    ) {
      const firstId = anchorElementsRef.current[0]?.getAttribute(
        `data-${dataAttribute}-anchor`,
      );
      if (firstId) {
        initialId = firstId;
        if (!rawHash) {
          window.history.replaceState({}, "", `#${firstId}`);
        }
      }
    }

    if (initialId) {
      updateActiveFromSectionId(initialId);
    } else {
      anchorElementsRef.current.forEach((item) =>
        item.removeAttribute("data-active"),
      );
    }

    if (!scrollElement) {
      return () => {
        container.removeEventListener("click", handleClick);
      };
    }

    let scrollTimeout: number | null = null;

    const onScroll = () => {
      if (!throttleTime) {
        handleScrollCore();
        return;
      }

      if (scrollTimeout != null) {
        window.clearTimeout(scrollTimeout);
      }

      scrollTimeout = window.setTimeout(() => {
        scrollTimeout = null;
        handleScrollCore();
      }, throttleTime) as unknown as number;
    };

    scrollElement.addEventListener("scroll", onScroll, { passive: true });

    const handleHashChange = () => {
      const id = window.location.hash.replace("#", "") || null;
      updateActiveFromSectionId(id);
    };

    window.addEventListener("hashchange", handleHashChange);

    return () => {
      container.removeEventListener("click", handleClick);
      scrollElement.removeEventListener("scroll", onScroll);
      window.removeEventListener("hashchange", handleHashChange);

      if (scrollTimeout != null) {
        window.clearTimeout(scrollTimeout);
      }
      if (programmaticTimeoutRef.current != null) {
        window.clearTimeout(programmaticTimeoutRef.current);
      }
    };
  }, [
    dataAttribute,
    getScrollElement,
    getSections,
    getMostVisibleSectionId,
    handleScrollCore,
    scheduleProgrammaticScrollEnd,
    scrollToSection,
    throttleTime,
    updateActiveFromSectionId,
  ]);

  return (
    <div data-slot="scrollspy" className={className} ref={selfRef}>
      {children}
    </div>
  );
}
