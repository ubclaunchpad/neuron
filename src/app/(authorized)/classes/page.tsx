"use client";

import clsx from "clsx";
import { parseAsString, useQueryState } from "nuqs";
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import "./page.scss";

import { ClassCard } from '@/components/classes/ClassCard';
import { PageLayout } from "@/components/PageLayout";
import { PageTitle } from "@/components/PageLayout/PageHeader";
import { Button } from '@/components/primitives/Button';
import { Select } from "@/components/primitives/Select";
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

const CategoryNavContext = React.createContext<{
  activeCategory: string | null;
  scrollToCategory: (id: string) => void;
  registerSection: (id: string, el: HTMLElement | null) => void;
  registerHeader: (id: string, el: HTMLElement | null) => void;
} | null>(null);

export function CategoryNavProvider({
  categories,
  scrollRef,
  children,
}: {
  categories: string[];
  scrollRef: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
}) {
  const initial = categories[0] ?? null;
  const [active, setActive] = React.useState<string | null>(initial);
  const activeRef = React.useRef<string | null>(active);
  React.useEffect(() => {
    activeRef.current = active;

    // Scroll header into view
    const headerEl = headerRegistry.current.get(active ?? "");
    if (headerEl) {
      headerEl.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
    }
  }, [active]);

  const sectionRegistry = React.useRef(new Map<string, HTMLElement>());
  const headerRegistry = React.useRef(new Map<string, HTMLElement>());

  // When true, ignore exactly one scroll event
  const ignoreNextScroll = React.useRef(false);

  const registerSection = React.useCallback((id: string, el: HTMLElement | null) => {
    if (el) {
      sectionRegistry.current.set(id, el);

      // If the user clicked this id before it was mounted, try to bring it into view now.
      if (id === activeRef.current && ignoreNextScroll.current) {
        el.scrollIntoView({ behavior: "auto", block: "start", inline: "nearest" });
      }
    } else {
      sectionRegistry.current.delete(id);
    }
  }, []);

  const registerHeader = React.useCallback((id: string, el: HTMLElement | null) => {
    if (el) {
      headerRegistry.current.set(id, el);

      // If the user clicked this id before it was mounted, try to bring it into view now.
      if (id === activeRef.current && ignoreNextScroll.current) {
        el.scrollIntoView({ behavior: "auto", block: "start", inline: "nearest" });
      }
    } else {
      headerRegistry.current.delete(id);
    }
  }, []);

  const scrollToCategory = React.useCallback((id: string) => {
    setActive(id);
    ignoreNextScroll.current = true;

    const el = sectionRegistry.current.get(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
    }
  }, []);

  // Scroll handler
  React.useEffect(() => {
    const container = scrollRef?.current;
    if (!container) return;

    let ticking = false;
    const onScroll = () => {
      if (ignoreNextScroll.current) {
        ignoreNextScroll.current = false;
        return;
      }

      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;

        const containerTop = container.getBoundingClientRect().top;
        let closestId: string | null = null;
        let closestDist = Number.POSITIVE_INFINITY;

        sectionRegistry.current.forEach((el, id) => {
          const dist = Math.abs(el.getBoundingClientRect().top - containerTop);
          if (dist < closestDist) {
            closestDist = dist;
            closestId = id;
          }
        });

        if (closestId && closestId !== activeRef.current) {
          setActive(closestId);
        }
      });
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    // Initialize from current position, but respect a just-clicked selection.
    onScroll();
    return () => container.removeEventListener("scroll", onScroll);
  }, [scrollRef]);

  return (
    <CategoryNavContext.Provider
      value={{ activeCategory: active, scrollToCategory, registerSection, registerHeader }}
    >{active}{children}</CategoryNavContext.Provider>
  );
}

export function CategorySection({
  category,
  children,
}: {
  category: string;
  children?: React.ReactNode;
}) {
  const { registerSection } = useContext(CategoryNavContext)!;
  const setRef = React.useCallback(
    (node: HTMLElement | null) => registerSection(category, node),
    [category, registerSection]
  );

  return (
    <section ref={setRef} className="classes__list-section" data-category={category}>
      <h3 className="classes__list-section-title">{category}</h3>
      {children}
    </section>
  );
}

function ClassesList({
  classes,
}: {
  classes: ListClass[];
}) {
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
      <Button className="classes__create-button large primary">
        <AddIcon/>
        Create Class
      </Button>
    </WithPermission>
    <div className="classes__list-content">
      {Object.entries(classesByCategory ?? {}).map(([category, classes]) => (
        <CategorySection key={category} category={category}>
          {classes.map((c) => (
            <ClassCard key={c.id} classData={c} />
          ))}
        </CategorySection>
      ))}
    </div>
  </>);
}

function EmptyClassesList() {
  return (<>
    No classes found
  </>);
}

export function ClassHeaderCategories() {
  const { activeCategory, scrollToCategory, registerHeader } = useContext(CategoryNavContext)!;

  return (
    <div className="classes__categories">
      {classCategories.map((category) => {
          const setRef = React.useCallback(
            (node: HTMLElement | null) => registerHeader(category, node),
            [category, registerHeader]
          );

          return (
            <Button 
              unstyled
              ref={setRef}
              key={category} 
              className={clsx(
                "classes__category", 
                { "active": category === activeCategory }
              )}
              onPress={() => scrollToCategory(category)}
            >{category}</Button>
          );
      })}
    </div>
  );
}

export default function ClassesListView() {
  const apiUtils = clientApi.useUtils();
  const [queryTerm, setQueryTerm] = useQueryState(
    "term",
    parseAsString.withDefault("current"),
  );  

  const { data: terms, isPending: isLoadingTerms, isError: isTermError } = clientApi.term.all.useQuery();
  const { data: classData, isPending: isLoadingClasses, isError: isClassError } = clientApi.class.list.useQuery(
    { term: queryTerm },
  );

  useEffect(() => {
    if (queryTerm == "current") {
      setSelectedTermId(classData?.term.id ?? null);
    }
  }, [classData]);

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
    <CategoryNavProvider categories={classCategories} scrollRef={contentScrollRef}>
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
          <div>This is the sidebar</div>
        </PageLayout.Sidebar>

        <div className="classes__content">
          <Loader isLoading={isLoadingClasses || isLoadingTerms} fallback={<div>Loading classes…</div>}>
            <WithPermission 
              permissions={{ permission: { classes: ["create"] }}}
              fallback={<>
                { !classData?.classes.length && <EmptyClassesList /> }
                { !!classData?.classes.length && <ClassesList classes={classData?.classes!} /> }
              </>}
            >
              { terms?.length === 0 && <div>Create your first term</div> }
              { !classData?.classes.length && <div>Create your first class</div> }
              { !!classData?.classes.length && <ClassesList classes={classData?.classes!} /> }
            </WithPermission>
          </Loader>
        </div>
      </PageLayout>
    </CategoryNavProvider>
  );
}
