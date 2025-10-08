"use client";

import clsx from "clsx";
import { parseAsString, useQueryState } from "nuqs";
import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./page.scss";

import { ActiveSectionProvider, Section, SectionLink, useActiveSection } from "@/components/classes/ActiveSectionProvider";
import { ClassCard } from '@/components/classes/ClassCard';
import { ClassSidebarContent } from "@/components/classes/ClassSidebar";
import { PageLayout, useSidebar } from "@/components/PageLayout";
import { PageTitle } from "@/components/PageLayout/PageHeader";
import { Button } from '@/components/primitives/Button';
import { Select } from "@/components/primitives/form/Select";
import { Loader } from '@/components/utils/Loader';
import { WithPermission } from '@/components/utils/WithPermission';
import { usePermission } from "@/hooks/use-permission";
import type { ListClass } from '@/models/class';
import { clientApi } from "@/trpc/client";
import AddIcon from "@public/assets/icons/add.svg";

export const classCategories = [
  "Online Exercise",
  "Creative & Expressive",
  "Care Partner Workshops",
  "Food & Nutrition",
  "In-Person Exercise",
  "One-on-One Exercise",
  "Other Opportunities",
] as const;

function ClassesList({
  classes,
}: {
  classes: ListClass[];
}) {
  const { setSelectedClassId } = useClassesPage();
  const { setIsOpen } = useSidebar();
  
  const handleSelectClass = useCallback((classId: string) => {
    setSelectedClassId(classId);
    setIsOpen(true);
  }, [setSelectedClassId, setIsOpen]);

  // Group classes by category
  const classesByCategory = useMemo(() => {
    const defaultCategory = "Other Opportunities";
    return classes.reduce((rec, c) => {
      const category = c.category ?? defaultCategory;
      rec[category] = [...(rec[category] || []), c];
      return rec;
    }, {} as Record<string, ListClass[]>);
  }, [classes]);

  return (<>
    <WithPermission permissions={{ permission: { classes: ["create"] }}}>
      <Button 
        className="classes__create-button large primary"
        href="/classes/edit"
      >
        <AddIcon/>
        Create Class
      </Button>
    </WithPermission>
    <div className="classes__list-content">
      {Object.entries(classesByCategory ?? {}).map(([category, classes]) => (
        <Section key={category} sectionId={category} className="classes__list-section">
          <h3 className="classes__list-section-title">{category}</h3>
          <div className="classes__list-section-content">
            {classes.map((cls) => (
              <ClassCard 
                key={cls.id} 
                classData={cls} 
                onPress={() => handleSelectClass(cls.id)}
              />
            ))}
          </div>
        </Section>
      ))}
    </div>
  </>);
}

function EmptyClassesList() {
  return (<>
    <WithPermission permissions={{ permission: { classes: ["create"] }}}>
      <Button 
        className="classes__create-button large primary"
        href="/classes/edit"
      >
        <AddIcon/>
        Create Class
      </Button>
    </WithPermission>
    No classes found
  </>);
}

export function ClassHeaderCategories() {
  const { activeSectionId } = useActiveSection();

  return (
    <div className="classes__categories">
      {classCategories.map((category) => (
        <SectionLink 
          key={category}
          sectionId={category}
          className={clsx(
            "classes__category", 
            { "active": category === activeSectionId }
          )}
        >{category}</SectionLink>
      ))}
    </div>
  );
}

const ClassesPageContext = React.createContext<{
  selectedClassId: string | null;
  setSelectedClassId: (classId: string | null) => void;
} | null>(null);

export const useClassesPage = () => {
  const ctx = React.useContext(ClassesPageContext);
  if (!ctx) throw new Error("useClassesPage must be used within the <ClassesPage> component");
  return ctx;
};

export default function ClassesPage() {
  const apiUtils = clientApi.useUtils();
  const [queryTerm, setQueryTerm] = useQueryState("term", parseAsString.withDefault("current"));
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const canCreateTerm = usePermission({ permission: { terms: ["create"] }});
  const {
    data: terms, 
    isPending: isLoadingTerms,
    isError: isTermError 
  } = clientApi.term.all.useQuery();
  const {
    data: classListData, 
    isPending: isLoadingClassList, 
    isError: isClassListError
  } = clientApi.class.list.useQuery(
    { term: queryTerm },
  );

  useEffect(() => {
    if (queryTerm == "current") {
      console.log(classListData?.term)
      setSelectedTermId(classListData?.term.id ?? null);
    }
  }, [classListData]);

  const [selectedTermId, setSelectedTermId] = useState<string | null>(
    queryTerm !== "current" ? queryTerm : null
  );

  const handleSelectTerm = useCallback((uuid: string) => {
    setQueryTerm(uuid);
    setSelectedTermId(uuid);

    // prefetch the classes for the selected term
    apiUtils.class.list.prefetch({ term: uuid }).catch(() => {});
  }, [setQueryTerm, apiUtils.class.list]);

  // Wire in the scroll ref to the content to keep track of the active category
  const contentScrollRef = useRef<HTMLDivElement>(null);
  return (
    <ActiveSectionProvider sectionIds={classCategories} scrollRef={contentScrollRef}>
      <ClassesPageContext.Provider value={{ selectedClassId, setSelectedClassId }}> 
        <PageLayout contentRef={contentScrollRef}>
          <PageLayout.Header>
            <PageTitle title="Classes">
              <PageTitle.RightContent>
                {(!isLoadingTerms && terms?.length !== 0) && 
                  <Select
                    overridePopoverContent
                    isLoading={isLoadingTerms}
                    items={terms}
                    selectedKey={selectedTermId ?? undefined}
                    isDisabled={!canCreateTerm && terms?.length === 1}
                    onSelectionChange={(k) => handleSelectTerm(k as string)}
                  >
                    <Select.ItemList items={terms}>
                      {terms?.map((term) => <Select.Item key={term.id} id={term.id}>{term.name}</Select.Item>)}
                    </Select.ItemList>
                    <WithPermission permissions={{ permission: { terms: ["create"] }}}>
                    </WithPermission>
                  </Select>}
              </PageTitle.RightContent>
            </PageTitle>
            <ClassHeaderCategories/>
          </PageLayout.Header>

          <PageLayout.Sidebar>
            <Suspense fallback={<div>Loading class…</div>}>
              <ClassSidebarContent />
            </Suspense>
          </PageLayout.Sidebar>

          <div className="classes__content">
            <Loader isLoading={isLoadingClassList || isLoadingTerms} fallback={<div>Loading classes…</div>}>
              <WithPermission 
                permissions={{ permission: { classes: ["create"] }}}
                fallback={<>
                  { !classListData?.classes.length && <EmptyClassesList /> }
                  { !!classListData?.classes.length && <ClassesList classes={classListData?.classes!} /> }
                </>}
              >
                { terms?.length === 0 && <div>Create your first term</div> }
                { !classListData?.classes || classListData?.classes.length === 0 && <EmptyClassesList /> }
                { classListData?.classes && classListData?.classes.length > 0 && <ClassesList classes={classListData?.classes!} /> }
              </WithPermission>
            </Loader>
          </div>
        </PageLayout>
      </ClassesPageContext.Provider>
    </ActiveSectionProvider>
  );
}
