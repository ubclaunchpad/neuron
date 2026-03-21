import { Skeleton } from "@/components/ui/skeleton";
import { ListItem } from "./list";

export function UserCardSkeleton() {
  return (
    <ListItem
      leadingContent={<Skeleton className="rounded-sm size-10.5 shrink-0" />}
      mainContent={
        <>
          <div className="flex gap-2 items-center mb-1">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-48" />
        </>
      }
      endContent={
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="size-8 rounded-md" />
        </div>
      }
    />
  );
}
