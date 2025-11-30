"use client";
import { parseAsString, useQueryState } from "nuqs";
import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";

import { Loader } from "@/components/utils/loader";
import { WithPermission } from "@/components/utils/with-permission";
import { usePermission } from "@/hooks/use-permission";
import { clientApi } from "@/trpc/client";

import { ClassDetailsAside } from "@/components/classes/list/class-details-aside";
import { ClassesEmptyView } from "@/components/classes/list/classes-empty-view";
import { ClassCategoriesNav } from "@/components/classes/list/content/class-categories-nav";
import { TermSelect } from "@/components/classes/list/components/term-select";
import {
  PageLayoutAside,
  PageLayoutContent,
  PageLayoutHeader,
  PageLayoutHeaderContent,
  PageLayoutHeaderTitle,
  usePageAside,
} from "@/components/page-layout";
import { ClassList } from "./content/class-list";

export type ClassesPageContextValue = {
  selectedTermId: string | null;
  selectedClassId: string | null;
  queryTerm: string;
  hasTerms: boolean;
  setSelectedClassId: (id: string | null) => void;
  setSelectedTermId: (id: string) => void;
  openAsideFor: (id: string) => void;
  closeAside: () => void;
  contentScrollRef: RefObject<HTMLElement | null>;
};

const Ctx = createContext<ClassesPageContextValue | null>(null);

export function useClassesPage() {
  const ctx = useContext(Ctx);
  if (!ctx)
    throw new Error("useClassesPage must be used within the ClassesPage");
  return ctx;
}

export function ClassListView() {
  const { setOpen } = usePageAside();
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null);
  const [queryTerm] = useQueryState(
    "term",
    parseAsString.withDefault("current"),
  );

  const openAsideFor = useCallback(
    (id: string) => {
      setSelectedClassId(id);
      setOpen(true);
    },
    [setOpen, setSelectedClassId],
  );

  const closeAside = useCallback(() => {
    setSelectedClassId(null);
    setOpen(false);
  }, [setOpen, setSelectedClassId]);

  const canCreateTerm = usePermission({ permission: { terms: ["create"] } });

  // Load terms first
  const { data: terms, isPending: isLoadingTerms } =
    clientApi.term.all.useQuery();

  const { data: currentTerm, isPending: isLoadingCurrentTerm } =
    clientApi.term.current.useQuery(undefined, {
      enabled: queryTerm === "current" && (terms?.length ?? 0) > 0,
    });

  // Set selected term once current term loads
  useEffect(() => {
    if (!selectedTermId && queryTerm === "current" && currentTerm) {
      setSelectedTermId(currentTerm.id);
    }
  }, [currentTerm, selectedTermId, queryTerm]);

  const hasTerms = (terms?.length ?? 0) > 0;

  // Only fetch classes if we have a selected term
  const { data: classListData, isPending: isLoadingClassList } =
    clientApi.class.list.useQuery(
      { term: queryTerm },
      {
        meta: { suppressToast: true },
        enabled: !!selectedTermId,
      },
    );

  // Determine if we're ready to show content
  const isInitializing =
    isLoadingTerms || (hasTerms && !selectedTermId && isLoadingCurrentTerm);

  const isLoadingContent =
    isInitializing || (!!selectedTermId && isLoadingClassList);

  const contextValue = useMemo(
    () => ({
      selectedClassId,
      selectedTermId,
      queryTerm,
      hasTerms,
      setSelectedClassId,
      setSelectedTermId,
      openAsideFor,
      closeAside,
      contentScrollRef,
    }),
    [
      selectedClassId,
      selectedTermId,
      queryTerm,
      hasTerms,
      setSelectedClassId,
      setSelectedTermId,
      openAsideFor,
      closeAside,
      contentScrollRef,
    ],
  );

  return (
    <Ctx.Provider value={contextValue}>
      <PageLayoutHeader>
        <PageLayoutHeaderContent>
          <PageLayoutHeaderTitle>Classes</PageLayoutHeaderTitle>

          {/* Only show term select if terms exist */}
          {hasTerms && (
            <TermSelect
              disableIfSingle={!canCreateTerm}
              className="self-justify-end"
            />
          )}
        </PageLayoutHeaderContent>

        <ClassCategoriesNav />
      </PageLayoutHeader>

      <PageLayoutAside>
        <Suspense fallback={<div>Loading class...</div>}>
          <ClassDetailsAside />
        </Suspense>
      </PageLayoutAside>

      <PageLayoutContent ref={contentScrollRef}>
        <div className="flex flex-col gap-6 p-9">
          <Loader
            isLoading={isLoadingContent}
            fallback={<div>Loading classes...</div>}
          >
            {!classListData?.classes?.length ? (
              <ClassesEmptyView />
            ) : (
              <ClassList classes={classListData.classes} />
            )}
          </Loader>
        </div>
      </PageLayoutContent>
    </Ctx.Provider>
  );
}
