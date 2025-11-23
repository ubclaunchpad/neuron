"use client";

import clsx from "clsx";
import { parseAsString, useQueryState } from "nuqs";
import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./page.scss";

import { ActiveSectionProvider, Section, SectionLink, useActiveSection } from "@/components/classes/ActiveSectionProvider";
import { ClassCard } from '@/components/classes/ClassCard';
import { PageLayout, useSidebar } from "@/components/PageLayout";
import { PageTitle } from "@/components/PageLayout/PageHeader";
import { Button } from '@/components/primitives/Button';
import { Select } from "@/components/primitives/Select";
import { SidebarContainer, SidebarItem } from "@/components/sidebar";
import { Loader } from '@/components/utils/Fallback';
import { WithPermission } from '@/components/utils/WithPermission';
import type { ListClass } from '@/models/class';
import { clientApi } from "@/trpc/client";
import AddIcon from "@public/assets/icons/add.svg";

const classCategories = [
  "Online Exercise",
  "Creative & Expressive",
  "Care Partner Workshops",
  "Food & Nutrition",
  "In-Person Exercise",
  "One-on-One Exercise",
  "Other Opportunities",
];

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
      rec[category] = [...(rec[category] ?? []), c];
      return rec;
    }, {} as Record<string, ListClass[]>);
  }, [classes]);

  return (<>
    <WithPermission permissions={{ permission: { classes: ["create"] }}}>
      <Button className="classes__create-button large primary">
        <AddIcon/>
        Create Class
      </Button>
    </WithPermission>
    <div className="classes__list-content">
      {Object.entries(classesByCategory ?? {}).map(([category, classes]) => (
        <Section key={category} sectionId={category} className="classes__list-section">
          <h3 className="classes__list-section-title">{category}</h3>
          {classes.map((cls) => (
            <Button 
              key={cls.id} 
              onPress={() => handleSelectClass(cls.id)}
              unstyled
            >
              <ClassCard classData={cls} />
            </Button>
          ))}
        </Section>
      ))}
    </div>
  </>);
}

function EmptyClassesList() {
  return (<>
    No classes found
  </>);
}

function ClassHeaderCategories() {
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

const useClassesPage = () => {
  const ctx = React.useContext(ClassesPageContext);
  if (!ctx) throw new Error("useClassesPage must be used within the <ClassesPage> component");
  return ctx;
};

export default function ClassesPage() {
  const apiUtils = clientApi.useUtils();
  const [queryTerm, setQueryTerm] = useQueryState("term", parseAsString.withDefault("current"));
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

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
      setSelectedTermId(classListData?.term.id ?? null);
    }
  }, [classListData, queryTerm]);

  const [selectedTermId, setSelectedTermId] = useState<string | null>(
    queryTerm !== "current" ? queryTerm : null
  );

  const handleSelectTerm = useCallback((uuid: string) => {
    void setQueryTerm(uuid);
    void setSelectedTermId(uuid);

    // prefetch the classes for the selected term
    apiUtils.class.list.prefetch({ term: uuid }).catch(() => {
      console.error(`Failed to prefetch classes for term ${uuid}`);
    });
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
                    isLoading={isLoadingTerms}
                    items={terms ?? []}
                    selectedKey={selectedTermId ?? undefined}
                    isDisabled={terms?.length === 1}
                    onSelectionChange={(k) => handleSelectTerm(k as string)}
                  >
                    {(item) => <Select.Item>{item.name}</Select.Item>}
                  </Select>}
              </PageTitle.RightContent>
            </PageTitle>
            <ClassHeaderCategories/>
          </PageLayout.Header>

          <PageLayout.Sidebar>
            <Suspense fallback={<div>Loading class…</div>}>
              <SidebarContainer>
                <SidebarContainer.Header>
                  <h3>Art from the Heart</h3>
                  <span>Mondays weekly, 10:00-11:00AM</span>
                  <span>Wednesdays weekly, 10:00-11:00AM</span>
                </SidebarContainer.Header>
                <SidebarContainer.Body>
                  <SidebarItem label="Something">
                    <div>This is the content</div>
                  </SidebarItem>
                  <SidebarItem label="Something Else">
                    <div>This is the content</div>
                  </SidebarItem>
                  <SidebarItem label="3rd Thing" inline={false}>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                  </SidebarItem>
                </SidebarContainer.Body>
                <SidebarContainer.Footer>
                  <div>This is the footer</div>
                </SidebarContainer.Footer>
              </SidebarContainer>
            </Suspense>
          </PageLayout.Sidebar>

          <div className="classes__content">
            <Loader isLoading={isLoadingClassList || isLoadingTerms} fallback={<div>Loading classes…</div>}>
              <WithPermission 
                permissions={{ permission: { classes: ["create"] }}}
                fallback={<>
                  {!classListData?.classes?.length ? <EmptyClassesList /> : <ClassesList classes={classListData.classes} />}
                </>}
              >
                {terms?.length === 0 ? <div>Create your first term</div> : (
                  !classListData?.classes?.length ? <div>Create your first class</div> : <ClassesList classes={classListData.classes} />
                )}
              </WithPermission>
            </Loader>
          </div>
        </PageLayout>
      </ClassesPageContext.Provider>
    </ActiveSectionProvider>
  );
}
