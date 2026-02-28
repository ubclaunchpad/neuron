import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

function FormFieldRow({ labelWidth = "w-20" }: { labelWidth?: string }) {
  return (
    <div>
      <Skeleton className={`${labelWidth} h-4 mb-2`} />
      <Skeleton className="w-full h-10" />
    </div>
  );
}

export function TermFormSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <FormFieldRow labelWidth="w-16" />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-3">
        <FormFieldRow labelWidth="w-20" />
        <FormFieldRow labelWidth="w-24" />
      </div>

      <Separator />

      <FormFieldRow labelWidth="w-14" />

      <div>
        <Skeleton className="w-24 h-4 mb-2" />
        <Skeleton className="w-full h-24" />
      </div>
    </div>
  );
}
