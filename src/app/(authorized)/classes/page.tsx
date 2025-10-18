"use client";
import { parseAsString, useQueryState } from "nuqs";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";

import { Loader } from "@/components/utils/loader";
import { WithPermission } from "@/components/utils/with-permission";
import { usePermission } from "@/hooks/use-permission";
import { clientApi } from "@/trpc/client";

import { ActiveSectionProvider } from "@/components/classes/active-section-provider";
import { ClassSidebarContent } from "@/components/classes/class-sidebar-content";
import {
  CategoriesNav,
  CLASS_CATEGORIES,
  ClassesGrid,
} from "@/components/classes/classes-grid-view";
import { ClassesPageProvider } from "@/components/classes/context";
import {
  PageLayout,
  PageLayoutAside,
  PageLayoutContent,
  PageLayoutHeader,
  PageLayoutHeaderContent,
  PageLayoutHeaderLeft,
  PageLayoutHeaderRight,
  PageLayoutHeaderTitle,
} from "@/components/page-layout";
import { Button } from "@/components/primitives/button";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/primitives/dialog";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/primitives/empty";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/primitives/select";
import { Skeleton } from "@/components/primitives/skeleton";
import type { Term } from "@/models/term";
import CalendarsIcon from "@public/assets/icons/calendars.svg";
import React from "react";

export function TermSelect({
  terms,
  selectedKey,
  onChange,
  isLoading,
  disableIfSingle,
}: {
  terms: Term[] | undefined;
  selectedKey?: string;
  onChange: (id: string) => void;
  isLoading?: boolean;
  disableIfSingle?: boolean;
}) {
  const apiUtils = clientApi.useUtils();

  // Load via skeleton
  if (isLoading) return <Skeleton className="h-10 w-30" />;

  const handleValueChange = React.useCallback(
    (id: string) => {
      // Prefetch classes for the selected term to speed up nav
      apiUtils.class.list.prefetch({ term: id }).catch(() => {});
      onChange(id);
    },
    [apiUtils.class.list, onChange],
  );

  const isDisabled =
    (disableIfSingle && (terms?.length ?? 0) <= 1) || isLoading;

  return (
    <Select
      value={selectedKey}
      onValueChange={handleValueChange}
      disabled={isDisabled}
    >
      <SelectTrigger className="min-w-48">
        <SelectValue
          placeholder={
            isLoading
              ? "Loading terms…"
              : terms?.length
                ? "Select term"
                : "No terms"
          }
        />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {(terms ?? []).map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export default function ClassesPageClient() {
  const apiUtils = clientApi.useUtils();
  const [queryTerm, setQueryTerm] = useQueryState(
    "term",
    parseAsString.withDefault("current"),
  );
  const canCreateTerm = usePermission({ permission: { terms: ["create"] } });

  const { data: termsData, isPending: isLoadingTerms } =
    clientApi.term.all.useQuery();
  const { data: classListData, isPending: isLoadingClassList } =
    clientApi.class.list.useQuery({ term: queryTerm }, { meta: { suppressToast: true }});

  const [selectedTermId, setSelectedTermId] = useState<string | null>(
    queryTerm !== "current" ? queryTerm : null,
  );

  useEffect(() => {
    if (queryTerm === "current") {
      setSelectedTermId(classListData?.term?.id ?? null);
    }
  }, [classListData, queryTerm]);

  const handleSelectTerm = useCallback(
    (uuid: string) => {
      setQueryTerm(uuid);
      setSelectedTermId(uuid);
      apiUtils.class.list.prefetch({ term: uuid }).catch(() => {});
    },
    [setQueryTerm, apiUtils.class.list],
  );

  // Track active category using the content scroll area
  const contentScrollRef = useRef<HTMLDivElement>(null);

  return (
    <ActiveSectionProvider
      sectionIds={CLASS_CATEGORIES}
      scrollRef={contentScrollRef}
    >
      <PageLayout>
        <ClassesPageProvider>
          <PageLayoutHeader>
            <PageLayoutHeaderContent>
              <PageLayoutHeaderRight>
                <PageLayoutHeaderTitle>Classes</PageLayoutHeaderTitle>
              </PageLayoutHeaderRight>
              <PageLayoutHeaderLeft>
                  {!!termsData?.length && (
                    <TermSelect
                      terms={termsData}
                      selectedKey={selectedTermId ?? undefined}
                      onChange={handleSelectTerm}
                      isLoading={isLoadingTerms}
                      disableIfSingle={!canCreateTerm}
                    />
                  )}
              </PageLayoutHeaderLeft>
            </PageLayoutHeaderContent>
            
            <CategoriesNav />
          </PageLayoutHeader>

          <PageLayoutAside>
            <Suspense fallback={<div>Loading class...</div>}>
              <ClassSidebarContent />
            </Suspense>
          </PageLayoutAside>

          <PageLayoutContent>
            <div ref={contentScrollRef} className="flex flex-col gap-6 p-9">
              <Loader
                isLoading={isLoadingClassList || isLoadingTerms}
                fallback={<div>Loading classes...</div>}
              >
                <WithPermission
                  permissions={{ permission: { classes: ["create"] } }}
                  fallback={
                    classListData?.classes?.length ? (
                      <ClassesGrid classes={classListData.classes} />
                    ) : (
                      "No classes found"
                    )
                  }
                >
                  {!termsData?.length ? (
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <CalendarsIcon />
                        </EmptyMedia>
                        <EmptyTitle>No Terms Yet</EmptyTitle>
                        <EmptyDescription>
                          You haven&apos;t created any terms yet. Get started by creating
                          your first term. 
                        </EmptyDescription>
                      </EmptyHeader>
                      <EmptyContent>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline">Create Term</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Create Term</DialogTitle>
                            </DialogHeader>
                            
                            some content

                            <DialogFooter>
                              <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                              </DialogClose>
                              <Button type="submit">Save changes</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </EmptyContent>
                    </Empty>
                  ) : !classListData?.classes?.length ? (
                    "No classes found"
                  ) : (
                    <ClassesGrid classes={classListData.classes} />
                  )}
                </WithPermission>
              </Loader>
            </div>
          </PageLayoutContent>
        </ClassesPageProvider>
      </PageLayout>
    </ActiveSectionProvider>
  );
}
