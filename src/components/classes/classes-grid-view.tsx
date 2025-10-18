"use client";

import * as React from "react";

import {
  Section,
  SectionLink,
  useActiveSection,
} from "@/components/classes/active-section-provider";
import { ClassCard } from "@/components/classes/class-card";
import { useClassesPage } from "@/components/classes/context";
import { cn } from "@/lib/utils";
import type { ListClass } from "@/models/class";
import { useMemo } from "react";

export const CLASS_CATEGORIES = [
  "Online Exercise",
  "Creative & Expressive",
  "Care Partner Workshops",
  "Food & Nutrition",
  "In-Person Exercise",
  "One-on-One Exercise",
  "Other Opportunities",
] as const;

export const DEFAULT_CLASS_CATEGORY: typeof CLASS_CATEGORIES[number] = "Other Opportunities";

export function CategoriesNav() {
  const { activeSectionId } = useActiveSection();
  
  return (
    <div
      className={cn(
        "flex gap-5 px-9 overflow-x-auto border-b border-border",
        "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      )}
    >
      {CLASS_CATEGORIES.map((category) => (
        <SectionLink
          key={category}
          sectionId={category}
          className={cn(
            "relative shrink-0 overflow-hidden px-1 pb-[6.5px] text-sm transition-colors",
            "before:absolute before:left-0 before:right-0 before:h-[5px] before:rounded-t-lg before:bg-primary-muted before:transition-[bottom] before:duration-200",
            category === activeSectionId
              ? "before:bottom-0"
              : "before:bottom-[-5px]",
          )}
        >
          {category}
        </SectionLink>
      ))}
    </div>
  );
}

export function CategorySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-7 scroll-mt-9 items-stretch">
      <h3 className="text-foreground pt-4 pb-2 border-b border-border font-semibold">
        {title}
      </h3>
      {children}
    </section>
  );
}

export function ClassesGrid({ classes }: { classes: ListClass[] }) {
  const { openSidebarFor } = useClassesPage();
  
  // Group classes by category
  const classesByCategory = useMemo(() => {
    return classes.reduce((rec, c) => {
      const category = c.category ?? DEFAULT_CLASS_CATEGORY;
      rec[category] = [...(rec[category] || []), c];
      return rec;
    }, {} as Record<string, ListClass[]>);
  }, [classes]);

  return (
    <div className="flex flex-col gap-6">
      {Object.entries(classesByCategory ?? {}).map(([ category, items ]) => (
        <Section key={category} sectionId={category} className="contents">
          <CategorySection title={category}>
            <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(180px,max-content))] justify-stretch">
              {items.map((c) => (
                <ClassCard
                  key={c.id}
                  classData={c}
                  onClick={() => openSidebarFor(c.id)}
                />
              ))}
            </div>
          </CategorySection>
        </Section>
      ))}
    </div>
  );
}
