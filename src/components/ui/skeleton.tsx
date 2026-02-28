import {
  AsideBody,
  AsideContainer,
  AsideField,
  AsideFieldContent,
  AsideFieldLabel,
  AsideHeader,
  AsideSection,
  AsideSectionContent,
} from "@/components/aside";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import React from "react";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-accent", className)}
      {...props}
    />
  );
}

function SkeletonList({
  numItems,
  containerClassName,
  itemClassName,
  itemRenderer,
}: {
  numItems: number;
  containerClassName: string;
  itemClassName?: string;
  itemRenderer?: (index: number) => React.ReactNode;
}) {
  return (
    <div className={containerClassName}>
      {Array.from({ length: numItems }, (_, itemIndex) =>
        itemRenderer ? (
          <React.Fragment key={itemIndex}>
            {itemRenderer(itemIndex)}
          </React.Fragment>
        ) : (
          <Skeleton key={itemIndex} className={itemClassName} />
        ),
      )}
    </div>
  );
}

function SkeletonListGroup({
  numGroups = 3,
  containerClassName,
  titleContainerClassName,
  titleClassName,
  itemContainerClassName,
  itemClassName,
  itemRenderer,
}: {
  numGroups?: number;
  containerClassName: string;
  titleContainerClassName: string;
  titleClassName: string;
  itemContainerClassName: string;
  itemClassName?: string;
  itemRenderer?: (index: number) => React.ReactNode;
}) {
  return (
    <>
      {Array.from({ length: numGroups }, (_, groupIndex) => {
        const numItems = groupIndex + 1;

        return (
          <section key={groupIndex} className={containerClassName}>
            <div className={titleContainerClassName}>
              <Skeleton className={titleClassName} />
            </div>
            <SkeletonList
              numItems={numItems}
              containerClassName={itemContainerClassName}
              itemClassName={itemClassName}
              itemRenderer={itemRenderer}
            />
          </section>
        );
      })}
    </>
  );
}

function UserListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="inline-flex items-start gap-2">
          <Skeleton className="rounded-lg size-10 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <Skeleton className="h-4 w-2/3 mb-1" />
            <Skeleton className="h-3 w-1/2 mb-1" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SkeletonAside() {
  return (
    <AsideContainer>
      <AsideHeader>
        <Skeleton className="h-5 w-2/5" />
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-7 w-3/5" />
      </AsideHeader>

      <Separator />

      <AsideBody>
        <AsideSection>
          <AsideSectionContent>
            <AsideField>
              <AsideFieldLabel>
                <Skeleton className="h-4 w-3/4" />
              </AsideFieldLabel>
              <AsideFieldContent>
                <Skeleton className="h-4 w-full" />
              </AsideFieldContent>
            </AsideField>
            <AsideField>
              <AsideFieldLabel>
                <Skeleton className="h-4 w-3/4" />
              </AsideFieldLabel>
              <AsideFieldContent>
                <Skeleton className="h-4 w-full" />
              </AsideFieldContent>
            </AsideField>
            <AsideField>
              <AsideFieldLabel>
                <Skeleton className="h-4 w-3/4" />
              </AsideFieldLabel>
              <AsideFieldContent>
                <Skeleton className="h-4 w-full" />
              </AsideFieldContent>
            </AsideField>
          </AsideSectionContent>
        </AsideSection>

        <AsideSection>
          <AsideSectionContent>
            <AsideField>
              <AsideFieldLabel>
                <Skeleton className="h-4 w-3/4" />
              </AsideFieldLabel>
              <AsideFieldContent>
                <Skeleton className="h-4 w-full" />
              </AsideFieldContent>
            </AsideField>
            <AsideField inline={false}>
              <AsideFieldLabel>
                <Skeleton className="h-4 w-1/3" />
              </AsideFieldLabel>
              <AsideFieldContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </AsideFieldContent>
            </AsideField>
          </AsideSectionContent>
        </AsideSection>

        <Separator />

        <div className="flex gap-2">
          <Skeleton className="w-24 h-9" />
          <Skeleton className="w-24 h-9" />
        </div>
      </AsideBody>
    </AsideContainer>
  );
}

export {
  Skeleton,
  SkeletonList,
  SkeletonListGroup,
  SkeletonAside,
  UserListSkeleton,
};
