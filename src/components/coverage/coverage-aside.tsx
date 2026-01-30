"use client"

import {
  AsideBody,
  AsideContainer,
  AsideDescription,
  AsideField,
  AsideFieldContent,
  AsideFieldLabel,
  AsideHeader,
  AsideSection,
  AsideSectionContent,
  AsideTitle,
} from "@/components/aside";
import { useCoveragePage } from "./coverage-page-context";
import { useEffect } from "react";
import { clientApi } from "@/trpc/client";

export function CoverageAside() {
    const { selectedItem, closeAside } = useCoveragePage();
    // Need to pass in coverage item AND shift item

    useEffect(() => {
    if (!selectedItem) {
        closeAside();
    }
    }, [selectedItem, closeAside]);

    return (
        <AsideContainer>
            <AsideHeader className="border-0">
                <AsideDescription>Day here</AsideDescription>
                <AsideDescription>
                Time
                </AsideDescription>
                <AsideTitle>Class Name</AsideTitle>
            </AsideHeader>
        </AsideContainer>
    );
}