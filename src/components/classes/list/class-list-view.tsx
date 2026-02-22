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
  usePageAside,
} from "@/components/page-layout";
import { ClassList } from "./content/class-list";
import { Skeleton, userListSkeleton } from "@/components/ui/skeleton";

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

const classListSkeleton = () => {
  const SkeletonGroup = () => (
    <>
      <Skeleton className="w-40 h-7 pt-4 pb-2" />
      <div className="flex flex-col px-5 mb-4">
        <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(180px,258px))] justify-stretch">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="w-64 h-85" />
          ))}
        </div>
      </div>
    </>
  );

  return (
    <>
      <Skeleton className="w-full h-10 mb-6" />
      {[1, 2].map((i) => (
        <SkeletonGroup key={i} />
      ))}
    </>
  );
};

const classDetailsAsideSkeleton = () => {
  return (
    <>
      <div className="pt-17 pb-5 pl-5 pr-9">
        {/* Title, subtitle */}
        <div className="pb-5">
          <Skeleton className="w-2/5 h-8 mb-2" />
          <Skeleton className="w-3/5 h-6 mb-2" />
        </div>

        {/* Description */}
        <div className="pt-4">
          <Skeleton className="w-1/4 h-6 mb-2" />
          <div className="pt-4">
            <Skeleton className="w-full h-5 mb-2" />
            <Skeleton className="w-full h-5 mb-2" />
            <Skeleton className="w-full h-5 mb-2" />
            <Skeleton className="w-3/4 h-5 mb-2" />
          </div>
        </div>

        {/* Schedule group */}
        <div className="pt-10">
          <Skeleton className="w-3/5 h-8 mb-2" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="w-1/2 h-5 mb-2" />
            <Skeleton className="w-3/4 h-5 mb-2" />

            <div></div>
            {userListSkeleton({ count: 3 })}
          </div>
        </div>

        {/* Button group */}
        <div className="flex gap-2 pt-10">
          <Skeleton className="w-24 h-10" />
          <Skeleton className="w-24 h-10" />
          <Skeleton className="w-24 h-10" />
        </div>
      </div>
    </>
  );
}

export function ClassListView() {
  const { setOpen } = usePageAside();
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null);
  const [queryTerm, setQueryTerm] = useQueryState(
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

  // Sync selected term once current term or query param changes
  useEffect(() => {
    if (!terms?.length) return;

    if (queryTerm === "current") {
      if (!selectedTermId && currentTerm) {
        setSelectedTermId(currentTerm.id);
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
      selectedClassId,
      selectedTermId,
      queryTerm,
      hasTerms,
      setSelectedClassId,
      setSelectedTermId: handleSelectTerm,
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
        <Suspense fallback={classDetailsAsideSkeleton()}>
          <ClassDetailsAside />
        </Suspense>
      </PageLayoutAside>

      <PageLayoutContent ref={contentScrollRef}>
        <div className="flex flex-col gap-6 p-9">
          <Loader
            isLoading={isLoadingContent}
            fallback={classListSkeleton()}
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
