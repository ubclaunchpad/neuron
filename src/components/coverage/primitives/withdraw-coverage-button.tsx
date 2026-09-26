"use client";

import { Button } from "@/components/primitives/button";
import { ConfirmDialog } from "@/components/primitives/confirm-dialog";
import { CoverageStatus } from "@/models/api/coverage";
import type { CoverageListItem } from "@/components/coverage/list/coverage-page-context";
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
        void apiUtils.coverage.invalidate();
      },
    });

  if (item.status !== CoverageStatus.open) {
    return null;
  }

  return (
    <ConfirmDialog
      title="Withdraw coverage request?"
      description="This will close your coverage request for this shift. Other volunteers will no longer be able to claim it."
      confirmLabel="Withdraw request"
      cancelLabel="Keep request"
      confirmVariant="destructive"
    >
      <Button
        variant="destructive-outline"
        className={className}
        pending={isPending}
        onClick={() =>
          cancelCoverageRequest({
            coverageRequestId: item.id,
          })
        }
      >
        <XIcon />
        <span>Withdraw</span>
      </Button>
    </ConfirmDialog>
  );
}
