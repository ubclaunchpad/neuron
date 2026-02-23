import { Skeleton } from "@/components/ui/skeleton";

export function TermFormSkeleton() {
  return (
    <form className="flex flex-col gap-4">
      {/* Term Name */}
      <div>
        <Skeleton className="w-1/8 h-4 mb-2" />
        <Skeleton className="w-full h-10" />
      </div>

      {/* Start Date and End Date */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-3">
        <div>
          <Skeleton className="w-1/4 h-4 mb-2" />
          <Skeleton className="w-full h-10" />
        </div>
        <div>
          <Skeleton className="w-1/4 h-4 mb-2" />
          <Skeleton className="w-full h-10" />
        </div>
      </div>

      {/* Separator */}
      <Skeleton className="w-full h-px" />

      {/* Holidays Section */}
      <div>
        <Skeleton className="w-1/6 h-5 mb-2" />
        <div className="mb-4 space-y-1">
          <Skeleton className="w-full h-4" />
          <Skeleton className="w-1/4 h-4" />
        </div>

        {/* Holiday Items */}
        <div>
          <Skeleton className="w-full h-10 mb-2" />
        </div>

        {/* Add Holiday Button */}
        <div className="mt-4">
          <Skeleton className="w-1/4 h-9" />
        </div>
      </div>

      {/* Dialog Footer */}
      <div className="flex justify-end gap-2 pt-4">
        <Skeleton className="w-1/6 h-9" />
        <Skeleton className="w-1/6 h-9" />
      </div>
    </form>
  );
}