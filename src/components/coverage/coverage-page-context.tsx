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
  const [selectedCoverageRequest, setSelectedCoverageRequest] =
    useState<CoverageListItem | null>(null);
  const [coverageRequests, setCoverageRequests] = useState<CoverageListItem[]>(
    [],
  );

  const openAsideFor = useCallback(
    (item: CoverageListItem) => {
      setSelectedCoverageRequest(item);
      setOpen(true);
    },
    [setOpen],
  );

  const closeAside = useCallback(() => {
    setSelectedCoverageRequest(null);
    setOpen(false);
  }, [setOpen]);

  const goToNext = useCallback(() => {
    setSelectedCoverageRequest((current) => {
      if (!current) return current;
      const currentIndex = coverageRequests.findIndex(
        (item) => item.id === current.id,
      );
      if (currentIndex < coverageRequests.length - 1) {
        const next = coverageRequests[currentIndex + 1]!;
        setOpen(true);
        return next;
      }
      return current;
    });
  }, [coverageRequests, setOpen]);

  const goToPrev = useCallback(() => {
    setSelectedCoverageRequest((current) => {
      if (!current) return current;
      const currentIndex = coverageRequests.findIndex(
        (item) => item.id === current.id,
      );
      if (currentIndex > 0) {
        const prev = coverageRequests[currentIndex - 1]!;
        setOpen(true);
        return prev;
      }
      return current;
    });
  }, [coverageRequests, setOpen]);

  return (
    <CoveragePageContext.Provider
      value={{
        selectedItem: selectedCoverageRequest,
        sortedItems: coverageRequests,
        openAsideFor,
        closeAside,
        setSortedItems: setCoverageRequests,
        goToNext,
        goToPrev,
      }}
    >
      {children}
    </CoveragePageContext.Provider>
  );
}
