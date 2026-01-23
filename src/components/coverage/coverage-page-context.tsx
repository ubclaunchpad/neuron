"use client";

import { usePageAside } from "@/components/page-layout";
import {
  createContext,
  useContext,
  useState,
  type PropsWithChildren,
} from "react";
import type { MockCoverageItem } from "./mock-data";

type CoveragePageContextValue = {
    selectedItem: MockCoverageItem | null;
    openAsideFor: (item: MockCoverageItem) => void;
    closeAside: () => void;
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
    const [selectedItem, setSelectedItem] = useState<MockCoverageItem | null>(null);

    const openAsideFor = (item: MockCoverageItem) => {
        setSelectedItem(item);
        setOpen(true);
    };

    const closeAside = () => {
        setSelectedItem(null);
        setOpen(false);
    };

    return (
        <CoveragePageContext.Provider value={{ selectedItem, openAsideFor, closeAside }}>
            {children}
        </CoveragePageContext.Provider>
    );
}