"use client"

import { useCoveragePage } from "./coverage-page-context";
import { useEffect } from "react";

export function CoverageAside() {
    const { selectedItem, closeAside } = useCoveragePage();

    useEffect(() => {
    if (!selectedItem) {
        closeAside();
    }
    }, [selectedItem, closeAside]);

    return <div>Coverage Aside - to be implemented</div>;
}