"use client";

import * as React from "react";

import { useClassesPage } from "@/components/classes/list/class-list-view";
import { ClassCard } from "@/components/classes/list/components/class-card";
import type { ListClass } from "@/models/class";
import AddIcon from "@public/assets/icons/add.svg";
import Link from "next/link";
import { useMemo } from "react";
import { TypographyTitle } from "@/components/ui/typography";
import { CLASS_CATEGORIES, DEFAULT_CLASS_CATEGORY } from "../../constants";
import { WithPermission } from "@/components/utils/with-permission";
import { Button } from "@/components/primitives/button";
import { getCategorySectionId } from "./class-categories-nav";
import { ClassCategorySection } from "../components/class-category-section";

type ClassCategory = (typeof CLASS_CATEGORIES)[number];
const CATEGORY_ORDER: Map<ClassCategory, number> = new Map(
  CLASS_CATEGORIES.map((category, index) => [category, index]),
);

export function ClassList({ classes }: { classes: ListClass[] }) {
  const { openAsideFor: openSidebarFor, selectedTermId } = useClassesPage();

  // Group classes by category and sort groups by the configured category order
  const classesByCategory = useMemo(() => {
    const grouped: Record<ClassCategory, ListClass[]> = classes.reduce(
      (rec, c) => {
        const category =
          (c.category as ClassCategory) ?? DEFAULT_CLASS_CATEGORY;
        rec[category] = [...(rec[category] ?? []), c];
        return rec;
      },
      {} as Record<ClassCategory, ListClass[]>,
    );

    return Object.entries(grouped).sort(([a], [b]) => {
      const aOrder = CATEGORY_ORDER.get(a as ClassCategory);
      const bOrder = CATEGORY_ORDER.get(b as ClassCategory);

      if (aOrder === undefined && bOrder === undefined) {
        return a.localeCompare(b);
      }
      if (aOrder === undefined) return 1;
      if (bOrder === undefined) return -1;
      return aOrder - bOrder;
    });
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
        {classesByCategory.map(([category, classesForCategory]) => {
          const sectionId = getCategorySectionId(category);

          const classesWithoutSubCategory = classesForCategory.filter(
            (c) => !c.subcategory,
          );

          // Group classes by subcategory
          const classesBySubcategory = classesForCategory.reduce(
            (rec, c) => {
              if (!c.subcategory) return rec; // Skip those without subcategory
              const subcategory = c.subcategory;
              rec[subcategory] = [...(rec[subcategory] ?? []), c];
              return rec;
            },
            {} as Record<string, ListClass[]>,
          );

          return (
            <ClassCategorySection
              key={category}
              id={sectionId}
              title={category}
            >
              {classesWithoutSubCategory.length > 0 && (
                <div className="grid gap-6 px-5 [grid-template-columns:repeat(auto-fit,minmax(180px,258px))] justify-stretch">
                  {classesWithoutSubCategory.map((c) => (
                    <ClassCard
                      key={c.id}
                      classData={c}
                      onClickAction={() => openSidebarFor(c.id)}
                    />
                  ))}
                </div>
              )}
              {Object.entries(classesBySubcategory ?? {}).map(
                ([subcategory, classesForSubcategory]) => (
                  <div
                    key={subcategory}
                    className="flex flex-col gap-3 scroll-mt-9 items-stretch px-5"
                  >
                    <TypographyTitle>{subcategory}</TypographyTitle>
                    <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(180px,258px))] justify-stretch">
                      {classesForSubcategory.map((c) => (
                        <ClassCard
                          key={c.id}
                          classData={c}
                          onClickAction={() => openSidebarFor(c.id)}
                        />
                      ))}
                    </div>
                  </div>
                ),
              )}
            </ClassCategorySection>
          );
        })}
      </div>
    </>
  );
}
