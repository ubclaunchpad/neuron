import { Item, ItemContent } from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";

export function CoverageItemSkeleton() {
  return (
    <Item size="sm">
      <Skeleton className="w-1.5 self-stretch rounded" />
      <ItemContent className="flex-none">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-4 w-12" />
      </ItemContent>
      <ItemContent>
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-4 w-40" />
      </ItemContent>
      <ItemContent>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-32" />
      </ItemContent>
    </Item>
  );
}
