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
        const items = Array.from({ length: numItems }, (_, itemIndex) => (
          <Skeleton key={itemIndex} className={itemClassName} />
        ));

        return (
          <section key={groupIndex} className={containerClassName}>
            <div className={titleContainerClassName}>
              <Skeleton className={titleClassName} />
            </div>
            <div className={itemContainerClassName}>
              {items}
            </div>
          </section>
        );
      })}
    </>
  );
}


export { Skeleton, skeletonListGroup }
