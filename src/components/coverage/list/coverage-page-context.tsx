"use client";

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
  selectedCoverageId: string | null;
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

type CoveragePageProviderProps = PropsWithChildren<{
  coverageId: string | null;
  setCoverageId: (id: string | null) => Promise<URLSearchParams>;
}>;

export function CoveragePageProvider({
  coverageId,
  setCoverageId,
  children,
}: CoveragePageProviderProps) {
  const [coverageRequests, setCoverageRequests] = useState<CoverageListItem[]>(
    [],
  );

  const openAsideFor = useCallback(
    (item: CoverageListItem) => {
      setCoverageId(item.id);
    },
    [setCoverageId],
  );

  const closeAside = useCallback(() => {
    setCoverageId(null);
  }, [setCoverageId]);

  const goToNext = useCallback(() => {
    if (!coverageId) return;
    const currentIndex = coverageRequests.findIndex(
      (item) => item.id === coverageId,
    );
    if (currentIndex >= 0 && currentIndex < coverageRequests.length - 1) {
      setCoverageId(coverageRequests[currentIndex + 1]!.id);
    }
  }, [coverageRequests, coverageId, setCoverageId]);

  const goToPrev = useCallback(() => {
    if (!coverageId) return;
    const currentIndex = coverageRequests.findIndex(
      (item) => item.id === coverageId,
    );
    if (currentIndex > 0) {
      setCoverageId(coverageRequests[currentIndex - 1]!.id);
    }
  }, [coverageRequests, coverageId, setCoverageId]);

  return (
    <CoveragePageContext.Provider
      value={{
        selectedCoverageId: coverageId,
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
