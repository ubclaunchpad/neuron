import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-accent", className)}
      {...props}
    />
  )
}

function skeletonList({
  numItems,
  containerClassName,
  itemClassName,
}: {
  numItems: number;
  containerClassName: string;
  itemClassName: string;
}) {
  return (
    <div className={containerClassName}>
      {Array.from({ length: numItems }, (_, itemIndex) => (
        <Skeleton key={itemIndex} className={itemClassName} />
      ))}
    </div>
  );
}

function skeletonListGroup({
  numGroups = 3,
  containerClassName,
  titleContainerClassName,
  titleClassName,
  itemContainerClassName,
  itemClassName,
}: {
  numGroups?: number;
  containerClassName: string;
  titleContainerClassName: string;
  titleClassName: string;
  itemContainerClassName: string;
  itemClassName: string;
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
            {skeletonList({
              numItems,
              containerClassName: itemContainerClassName,
              itemClassName,
            })}
          </section>
        );
      })}
    </>
  );
}

function userListSkeleton({ count = 3 }: { count?: number } = {}) {
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


function skeletonAside() {
  const dataRow = <Skeleton className="w-3/4 h-5 mb-2" />;

  const rows = [
    { left: dataRow, right: dataRow },
    { left: dataRow, right: dataRow },
    { left: null, right: userListSkeleton({ count: 4 }) },
    { left: dataRow, right: dataRow },
  ];

  return (
    <>
      <div className="pt-17 pb-5 pl-5 pr-9">
        {/* Date, time, title */}
        <div className="pb-5">
          <Skeleton className="w-2/5 h-6 mb-2" />
          <Skeleton className="w-2/5 h-6 mb-2" />
          <Skeleton className="w-1/3 h-8 mb-2" />
        </div>

        {/* Shift information */}
        <div className="space-y-3 pt-5">
          {rows.map((row, i) => (
            <div key={i} className="grid grid-cols-2 gap-4">
              <div>{row.left}</div>
              <div>{row.right}</div>
            </div>
          ))}
        </div>

        {/* Details */}
        <div className="pt-4">
          <Skeleton className="w-full h-5 mb-2" />
          <Skeleton className="w-full h-5 mb-2" />
          <Skeleton className="w-3/4 h-5 mb-2" />
        </div>
      </div>
    </>
  );
}

export { Skeleton, skeletonList, skeletonListGroup, skeletonAside, userListSkeleton }
