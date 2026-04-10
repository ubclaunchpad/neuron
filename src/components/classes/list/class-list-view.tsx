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
} from "@/components/page-layout";
import { ClassList } from "./content/class-list";
import { ClassListSkeleton } from "./class-list-skeleton";
import AddIcon from "@public/assets/icons/add.svg";
import Link from "next/link";
import { WithPermission } from "@/components/utils/with-permission";
import { Button } from "@/components/primitives/button";
import { SkeletonAside } from "@/components/ui/skeleton";

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

type ClassListViewProps = {
  classId: string | null;
  setClassId: (id: string | null) => Promise<URLSearchParams>;
};

export function ClassListView({ classId, setClassId }: ClassListViewProps) {
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null);
  const [queryTerm, setQueryTerm] = useQueryState(
    "term",
    parseAsString.withDefault("current"),
  );

  const openAsideFor = useCallback(
    (id: string) => {
      setClassId(id);
    },
    [setClassId],
  );

  const closeAside = useCallback(() => {
    setClassId(null);
  }, [setClassId]);

  // When a classId is present (e.g. from URL), fetch the class and navigate
  // to its term so the list shows the correct term's classes.
  const { data: linkedClass } = clientApi.class.byId.useQuery(
    { classId: classId ?? "" },
    { enabled: !!classId },
  );

  useEffect(() => {
    if (linkedClass?.termId && linkedClass.termId !== selectedTermId) {
      setSelectedTermId(linkedClass.termId);
      void setQueryTerm(linkedClass.termId);
    }
  }, [linkedClass?.termId, selectedTermId, setQueryTerm]);

  const canCreateTerm = usePermission({ permission: { terms: ["create"] } });

  // Load terms first
  const { data: terms, isPending: isLoadingTerms } =
    clientApi.term.all.useQuery();

  const { data: currentTerm, isPending: isLoadingCurrentTerm } =
    clientApi.term.current.useQuery(undefined, {
      enabled: queryTerm === "current" && (terms?.length ?? 0) > 0,
    });

  // Sync selected term once current term or query param changes
  useEffect(() => {
    if (!terms?.length) return;

    if (queryTerm === "current") {
      if (!selectedTermId && currentTerm) {
        setSelectedTermId(currentTerm.id);
      } else if (!selectedTermId && !isLoadingCurrentTerm && terms?.[0]) {
        // No current term returned from backend; fall back to first term
        setSelectedTermId(terms[0].id);
      }
      return;
    }

    if (
      terms.some((term) => term.id === queryTerm) &&
      queryTerm !== selectedTermId
    ) {
      setSelectedTermId(queryTerm);
    }
  }, [currentTerm, queryTerm, selectedTermId, terms]);

  const handleSelectTerm = useCallback(
    (termId: string) => {
      setSelectedTermId(termId);
      setQueryTerm(termId);
    },
    [setQueryTerm, setSelectedTermId],
  );

  const hasTerms = (terms?.length ?? 0) > 0;

  // Only fetch classes if we have a selected term
  const { data: classListData, isPending: isLoadingClassList } =
    clientApi.class.list.useQuery(
      { term: selectedTermId ?? queryTerm },
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
      selectedClassId: classId,
      selectedTermId,
      queryTerm,
      hasTerms,
      setSelectedClassId: setClassId,
      setSelectedTermId: handleSelectTerm,
      openAsideFor,
      closeAside,
      contentScrollRef,
    }),
    [
      classId,
      selectedTermId,
      queryTerm,
      hasTerms,
      setClassId,
      handleSelectTerm,
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
        <Suspense fallback={<SkeletonAside />}>
          <ClassDetailsAside />
        </Suspense>
      </PageLayoutAside>

      <PageLayoutContent ref={contentScrollRef}>
        <div className="flex flex-col gap-6 p-9">
          {(isLoadingContent || !!classListData?.classes?.length) && (
            <WithPermission
              permissions={{ permission: { classes: ["create"] } }}
            >
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
          )}

          <Loader isLoading={isLoadingContent} fallback={<ClassListSkeleton />}>
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
