import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function FormFieldRow({ labelWidth = "w-20" }: { labelWidth?: string }) {
  return (
    <div>
      <Skeleton className={`${labelWidth} h-4 mb-2`} />
      <Skeleton className="w-full h-10" />
    </div>
  );
}

export function ClassFormShellSkeleton() {
  return (
    <>
      {/* General Card */}
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>

        <CardContent className="flex flex-col gap-5">
          <FormFieldRow labelWidth="w-16" />

          <div className="flex gap-4">
            <div className="flex-1">
              <FormFieldRow labelWidth="w-20" />
            </div>
            <div className="flex-1">
              <FormFieldRow labelWidth="w-24" />
            </div>
          </div>

          <FormFieldRow labelWidth="w-14" />

          <div>
            <Skeleton className="w-24 h-4 mb-2" />
            <Skeleton className="w-full h-24" />
          </div>

          <FormFieldRow labelWidth="w-28" />

          <div>
            <Skeleton className="w-28 h-4 mb-2" />
            <Skeleton className="w-full h-32" />
          </div>
        </CardContent>
      </Card>

      {/* Schedules Card */}
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>

        <CardContent className="flex flex-col gap-5">
          <FormFieldRow labelWidth="w-20" />
          <FormFieldRow labelWidth="w-24" />

          <div className="flex justify-end gap-2 pt-2">
            <Skeleton className="w-24 h-9" />
            <Skeleton className="w-24 h-9" />
          </div>
        </CardContent>
      </Card>
    </>
  );
}
