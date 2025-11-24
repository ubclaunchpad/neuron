"use client";

import * as React from "react";

import { ClassCard } from "@/components/classes/class-card";
import { useClassesPage } from "@/components/classes/classes-view";
import { Scrollspy } from "@/components/primitives/scrollspy";
import { cn } from "@/lib/utils";
import type { ListClass } from "@/models/class";
import AddIcon from "@public/assets/icons/add.svg";
import Link from "next/link";
import { useMemo } from "react";
import { Button } from "../primitives/button";
import { TypographyTitle } from "../primitives/typography";
import { WithPermission } from "../utils/with-permission";
import { CLASS_CATEGORIES, DEFAULT_CLASS_CATEGORY } from "./constants";

function getCategorySectionId(category: string) {
  return `category-${category
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "")}`;
}

export function CategoriesNav() {
  const { contentScrollRef } = useClassesPage();

  return (
    <Scrollspy
      targetRef={contentScrollRef}
      offset={120} // tweak to match your sticky header height
      className={cn(
        "flex gap-5 px-9 overflow-x-auto border-b border-border",
        "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
      )}
    >
      {CLASS_CATEGORIES.map((category) => {
        const sectionId = getCategorySectionId(category);

        return (
          <button
            key={category}
            type="button"
            data-scrollspy-anchor={sectionId}
            className={cn(
              "relative shrink-0 overflow-hidden px-1 pb-[6.5px] text-sm transition-colors",
              "before:absolute before:left-0 before:right-0 before:h-[5px] before:rounded-t-lg",
              "before:bg-primary-muted before:transition-[bottom] before:duration-200",
              "before:bottom-[-5px]",
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

export function CategorySection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="flex flex-col gap-7 scroll-mt-9 items-stretch">
      <TypographyTitle className="pt-4 pb-2 border-b border-border">
        {title}
      </TypographyTitle>
      {children}
    </section>
  );
}

export function ClassesGrid({ classes }: { classes: ListClass[] }) {
  const { openSidebarFor, selectedTermId } = useClassesPage();

  // Group classes by category
  const classesByCategory = useMemo(() => {
    return classes.reduce(
      (rec, c) => {
        const category = c.category ?? DEFAULT_CLASS_CATEGORY;
        rec[category] = [...(rec[category] ?? []), c];
        return rec;
      },
      {} as Record<string, ListClass[]>,
    );
  }, [classes]);

  return (
    <>
      <WithPermission permissions={{ permission: { classes: ["create"] } }}>
        <Button asChild>
          <Link
            href={{
              pathname: "classes/edit",
              query: { termId: selectedTermId },
            }}
          >
            <AddIcon />
            Create Class
          </Link>
        </Button>
      </WithPermission>

      <div className="flex flex-col gap-6">
        {Object.entries(classesByCategory ?? {}).map(([category, classesForCategory]) => {
          const sectionId = getCategorySectionId(category);

          const classesWithoutSubCategory = classesForCategory.filter(c => !c.subcategory);

          // Group classes by subcategory
          const classesBySubcategory = useMemo(() => {
            return classesForCategory.reduce(
              (rec, c) => {
                if (!c.subcategory) return rec; // Skip those without subcategory
                const subcategory = c.subcategory;
                rec[subcategory] = [...(rec[subcategory] ?? []), c];
                return rec;
              },
              {} as Record<string, ListClass[]>,
            );
          }, [classesForCategory]);

          return (
            <CategorySection key={category} id={sectionId} title={category}>
              {classesWithoutSubCategory.length > 0 && <div className="grid gap-6 px-5 [grid-template-columns:repeat(auto-fit,minmax(180px,258px))] justify-stretch">
                {classesWithoutSubCategory.map((c) => (
                  <ClassCard
                    key={c.id}
                    classData={c}
                    onClick={() => openSidebarFor(c.id)}
                  />
                ))}
              </div>}
              {Object.entries(classesBySubcategory ?? {}).map(([subcategory, classesForSubcategory]) => (
                <div key={subcategory} className="flex flex-col gap-3 scroll-mt-9 items-stretch px-5">
                  <TypographyTitle>
                    {subcategory}
                  </TypographyTitle>
                  <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(180px,258px))] justify-stretch">
                    {classesForSubcategory.map((c) => (
                      <ClassCard
                        key={c.id}
                        classData={c}
                        onClick={() => openSidebarFor(c.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </CategorySection>
          );
        })}
      </div>
    </>
  );
}
