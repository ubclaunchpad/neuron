"use client";

import { AlertDialog } from "@/components/primitives/alert-dialog";
import { Button } from "@/components/primitives/button";
import { CoverageStatus } from "@/models/api/coverage";
import type { CoverageListItem } from "./coverage-page-context";
import { clientApi } from "@/trpc/client";

export function FillCoverageButton({
  item,
  className,
}: {
  item: CoverageListItem;
  className?: string;
}) {
  const apiUtils = clientApi.useUtils();
  const { mutate: fillCoverageRequest, isPending } =
    clientApi.coverage.fillCoverageRequest.useMutation({
      onSuccess: () => {
        void apiUtils.coverage.list.invalidate();
      },
    });

  if (item.status !== CoverageStatus.open) {
    return null;
  }

  return (
    <AlertDialog
      alertTitle="Take this shift?"
      alertDescription="You will be assigned to cover this shift. The requesting volunteer will be notified."
      alertActionAsOverride
      alertActionContent={
        <Button size="sm" variant="default" pending={isPending}>
          Yes, take shift
        </Button>
      }
      onAccept={() =>
        fillCoverageRequest({
          coverageRequestId: item.id,
        })
      }
    >
      <Button variant="default" className={className} pending={isPending}>
        Take Shift
      </Button>
    </AlertDialog>
  );
}
