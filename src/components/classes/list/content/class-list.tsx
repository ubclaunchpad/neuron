"use client";

import * as React from "react";

import { useClassesPage } from "@/components/classes/list/class-list-view";
import { ClassCard } from "@/components/classes/list/components/class-card";
import type { ListClass } from "@/models/class";
import AddIcon from "@public/assets/icons/add.svg";
import Link from "next/link";
import { useMemo } from "react";
import { TypographyTitle } from "@/components/ui/typography";
import { DEFAULT_CLASS_CATEGORY } from "../../constants";
import { WithPermission } from "@/components/utils/with-permission";
import { Button } from "@/components/primitives/button";
import { getCategorySectionId } from "./class-categories-nav";
import { ClassCategorySection } from "../components/class-category-section";

export function ClassList({ classes }: { classes: ListClass[] }) {
  const { openAsideFor: openSidebarFor, selectedTermId } = useClassesPage();

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
        {Object.entries(classesByCategory ?? {}).map(
          ([category, classesForCategory]) => {
            const sectionId = getCategorySectionId(category);

            const classesWithoutSubCategory = classesForCategory.filter(
              (c) => !c.subcategory,
            );

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
          },
        )}
      </div>
    </>
  );
}
