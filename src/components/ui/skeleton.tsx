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


export { Skeleton, skeletonList, skeletonListGroup }
