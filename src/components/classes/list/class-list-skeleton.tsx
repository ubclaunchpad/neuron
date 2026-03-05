import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const ClassCardSkeleton = () => (
  <Card size="sm" className="max-w-full w-64.5">
    <CardContent className="flex flex-col gap-2">
      <Skeleton className="w-full aspect-square rounded-md" />
      <div className="flex flex-col items-start mb-4">
        <Skeleton className="h-3 w-16 mb-1" />
        <Skeleton className="h-5 w-3/4 mb-1" />
        <Skeleton className="h-3 w-full mb-1" />
        <Skeleton className="h-3 w-4/5" />
      </div>
    </CardContent>
  </Card>
);

export function ClassListSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-7 items-stretch">
        <div className="pt-4 pb-2 border-b border-border">
          <Skeleton className="w-40 h-7" />
        </div>
        <div className="grid gap-6 px-5 grid-cols-[repeat(auto-fit,minmax(180px,258px))] justify-stretch">
          {[1, 2, 3].map((i) => (
            <ClassCardSkeleton key={i} />
          ))}
        </div>
        <div className="flex flex-col gap-3 scroll-mt-9 items-stretch px-5">
          <div className="pt-4 pb-2 border-b border-border">
            <Skeleton className="w-40 h-7" />
          </div>
          <div className="grid gap-6 px-5 grid-cols-[repeat(auto-fit,minmax(180px,258px))] justify-stretch">
            {[1, 2, 3].map((i) => (
              <ClassCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
