"use client";

import { usePageAside } from "@/components/page-layout";
import {
  createContext,
  useCallback,
  useContext,
  useState,
  type PropsWithChildren,
} from "react";
import type {
  ListCoverageRequestBase,
  ListCoverageRequestWithReason,
} from "@/models/coverage";

export type CoverageListItem =
  | ListCoverageRequestBase
  | ListCoverageRequestWithReason;

type CoveragePageContextValue = {
  selectedItem: CoverageListItem | null;
  sortedItems: CoverageListItem[];
  openAsideFor: (item: CoverageListItem) => void;
  closeAside: () => void;
  setSortedItems: (items: CoverageListItem[]) => void;
  goToNext: () => void;
  goToPrev: () => void;
};

const CoveragePageContext = createContext<CoveragePageContextValue | null>(
  null,
);

export function useCoveragePage() {
  const ctx = useContext(CoveragePageContext);
  if (!ctx) {
    throw new Error("useCoveragePage must be used within CoveragePageProvider");
  }
  return ctx;
}

export function CoveragePageProvider({ children }: PropsWithChildren) {
  const { setOpen } = usePageAside();
  const [selectedItem, setSelectedItem] = useState<CoverageListItem | null>(
    null,
  );
  const [sortedItems, setSortedItems] = useState<CoverageListItem[]>([]);

  const openAsideFor = useCallback(
    (item: CoverageListItem) => {
      setSelectedItem(item);
      setOpen(true);
    },
    [setOpen],
  );

  const closeAside = useCallback(() => {
    setSelectedItem(null);
    setOpen(false);
  }, [setOpen]);

  const goToNext = useCallback(() => {
    setSelectedItem((current) => {
      if (!current) return current;
      const currentIndex = sortedItems.findIndex(
        (item) => item.id === current.id,
      );
      if (currentIndex < sortedItems.length - 1) {
        const next = sortedItems[currentIndex + 1]!;
        setOpen(true);
        return next;
      }
      return current;
    });
  }, [sortedItems, setOpen]);

  const goToPrev = useCallback(() => {
    setSelectedItem((current) => {
      if (!current) return current;
      const currentIndex = sortedItems.findIndex(
        (item) => item.id === current.id,
      );
      if (currentIndex > 0) {
        const prev = sortedItems[currentIndex - 1]!;
        setOpen(true);
        return prev;
      }
      return current;
    });
  }, [sortedItems, setOpen]);

  return (
    <CoveragePageContext.Provider
      value={{
        selectedItem,
        sortedItems,
        openAsideFor,
        closeAside,
        setSortedItems,
        goToNext,
        goToPrev,
      }}
    >
      {children}
    </CoveragePageContext.Provider>
  );
}
