"use client";

import { usePageAside } from "@/components/page-layout";
import {
  createContext,
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

  const openAsideFor = (item: CoverageListItem) => {
    setSelectedItem(item);
    setOpen(true);
  };

  const closeAside = () => {
    setSelectedItem(null);
    setOpen(false);
  };

  const goToNext = () => {
    if (!selectedItem) return;
    const currentIndex = sortedItems.findIndex(
      (item) => item.id === selectedItem.id,
    );
    if (currentIndex < sortedItems.length - 1) {
      openAsideFor(sortedItems[currentIndex + 1]!);
    }
  };

  const goToPrev = () => {
    if (!selectedItem) return;
    const currentIndex = sortedItems.findIndex(
      (item) => item.id === selectedItem.id,
    );
    if (currentIndex > 0) {
      openAsideFor(sortedItems[currentIndex - 1]!);
    }
  };

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
