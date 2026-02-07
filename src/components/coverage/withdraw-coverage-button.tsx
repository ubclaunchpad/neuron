"use client";

import { AlertDialog } from "@/components/primitives/alert-dialog";
import { Button } from "@/components/primitives/button";
import { CoverageStatus } from "@/models/api/coverage";
import type { CoverageListItem } from "./coverage-page-context";
import { clientApi } from "@/trpc/client";
import { XIcon } from "lucide-react";

export function WithdrawCoverageButton({
  item,
  className,
}: {
  item: CoverageListItem;
  className?: string;
}) {
  const apiUtils = clientApi.useUtils();
  const { mutate: cancelCoverageRequest, isPending } =
    clientApi.coverage.cancelCoverageRequest.useMutation({
      onSuccess: () => {
        void apiUtils.coverage.list.invalidate();
      },
    });

  if (item.status !== CoverageStatus.open) {
    return null;
  }

  return (
    <AlertDialog
      alertTitle="Withdraw coverage request?"
      alertDescription="This will close your coverage request for this shift. Other volunteers will no longer see it."
      alertActionAsOverride
      alertActionContent={
        <Button size="sm" variant="destructive" pending={isPending}>
          Yes, withdraw request
        </Button>
      }
      onAccept={() =>
        cancelCoverageRequest({
          coverageRequestId: item.id,
        })
      }
    >
      <Button
        variant="destructive-outline"
        className={className}
        pending={isPending}
      >
        <XIcon />
        <span>Withdraw</span>
      </Button>
    </AlertDialog>
  );
}
