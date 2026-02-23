import { Skeleton } from "@/components/ui/skeleton";

export function ClassFormShellSkeleton() {
  return (<>
    <div className="flex flex-col gap-6 p-9 pt-4">
      <div>
        <Skeleton className="w-1/12 h-4 mb-2" />
        <Skeleton className="w-1/6 h-4" />
      </div>

      {/* Title input */}
      <div>
        <Skeleton className="w-1/12 h-4 mb-2" />
        <Skeleton className="w-full h-10" />
      </div>

      {/* Category */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Skeleton className="w-1/4 h-4 mb-2" />
          <Skeleton className="w-full h-10" />
        </div>
        <div>
          <Skeleton className="w-1/4 h-4 mb-2" />
          <Skeleton className="w-full h-10" />
        </div>
      </div>

      {/* Levels selection */}
      <div>
        <div className="flex justify-between">
          <Skeleton className="w-1/12 h-4 mb-2" />
          <Skeleton className="w-1/12 h-4 mb-2" />
        </div>
        <Skeleton className="w-full h-2 mb-2" />
        <div className="flex justify-between">
          <Skeleton className="w-1/12 h-4 mb-2" />
          <Skeleton className="w-1/12 h-4 mb-2" />
          <Skeleton className="w-1/12 h-4 mb-2" />
          <Skeleton className="w-1/12 h-4 mb-2" />
        </div>
      </div>

      {/* Description input */}
      <div>
        <Skeleton className="w-1/12 h-4 mb-2" />
        <Skeleton className="w-1/6 h-4 mb-2" />
        <Skeleton className="w-full h-20" />
      </div>

      {/* Zoom link input */}
      <div>
        <Skeleton className="w-1/12 h-4 mb-2" />
        <Skeleton className="w-1/6 h-4 mb-2" />
        <Skeleton className="w-full h-10" />
      </div>

      {/* Cover image input */}
      <div>
        <Skeleton className="w-1/12 h-4 mb-2" />
        <Skeleton className="w-1/6 h-4 mb-2" />
        
        <div className="flex gap-4">
          <div className="flex flex-col gap-6">
            <Skeleton className="w-35 h-35" />
            <Skeleton className="w-35 h-8"/>
          </div>
          <div className="flex-1">
            <Skeleton className="w-full h-49" />
          </div>
        </div>
      </div>
    </div>

    {/* Schedule section */}
    <div className="flex flex-col gap-6 p-9 pt-4">
      <div>
        <Skeleton className="w-1/12 h-4 mb-2" />
        <Skeleton className="w-1/3 h-4" />
      </div>

      {/* Schedule */}
      <div className="p-4 flex justify-between">
        <div className="w-1/2">
          <Skeleton className="w-1/3 h-4 mb-2" />
          <Skeleton className="w-1/4 h-4" />
        </div>
        <Skeleton className="w-1/4 h-8" />
      </div>

      <Skeleton className="w-39 h-8" />
    </div>
  </>)
}