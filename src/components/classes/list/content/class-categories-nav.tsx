"use client";

import * as React from "react";

import { useClassesPage } from "@/components/classes/list/class-list-view";
import { Scrollspy } from "@/components/ui/scrollspy";
import { cn } from "@/lib/utils";
import { CLASS_CATEGORIES, DEFAULT_CLASS_CATEGORY } from "../../constants";

export function getCategorySectionId(category: string) {
  return `category-${category
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "")}`;
}

export function ClassCategoriesNav() {
  const { contentScrollRef } = useClassesPage();

  return (
    <Scrollspy
      targetRef={contentScrollRef}
      dataAttribute="section"
      className={cn(
        "flex gap-5 px-9 overflow-x-auto border-b border-border max-w-[100vw]",
        "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
      )}
    >
      {CLASS_CATEGORIES.map((category) => {
        const sectionId = getCategorySectionId(category);

        return (
          <button
            key={category}
            type="button"
            data-section-anchor={sectionId}
            className={cn(
              "relative text-muted-foreground shrink-0 overflow-hidden px-1 pb-[6.5px] text-sm transition-colors",
              "before:absolute before:left-0 before:right-0 before:h-[5px] before:rounded-t-lg",
              "before:bg-primary-muted before:transition-[bottom] before:duration-200",
              "before:bottom-[-5px] scroll-m-5",
              "data-[active=true]:before:bottom-0",
            )}
          >
            {category}
          </button>
        );
      })}
    </Scrollspy>
  );
}
