"use client";

import { Button } from "@/components/primitives/button";
import { ConfirmDialog } from "@/components/primitives/confirm-dialog";
import { CoverageStatus } from "@/models/api/coverage";
import type { SingleShiftWithPersonalContext } from "@/models/shift";
import { clientApi } from "@/trpc/client";
import NiceModal from "@ebay/nice-modal-react";
import { RequestCoverageModal } from "./modals/request-coverage-modal";
import { UserX, UserXIcon, XIcon } from "lucide-react";

export function RequestCoverageButton({
  shift,
  className,
}: {
  shift: SingleShiftWithPersonalContext;
  className?: string;
}) {
  const apiUtils = clientApi.useUtils();
  const { mutate: cancelCoverageRequest, isPending: isCancelling } =
    clientApi.coverage.cancelCoverageRequest.useMutation({
      onSuccess: () => {
        void apiUtils.shift.list.invalidate();
        void apiUtils.shift.byId.invalidate({ shiftId: shift.id });
      },
    });

  if (
    !shift.coverageRequest ||
    shift.coverageRequest.status === CoverageStatus.withdrawn
  ) {
    return (
      <Button
        variant="outline"
        className={className}
        onClick={() => NiceModal.show(RequestCoverageModal, { shift })}
      >
        <UserXIcon />
        <span>Request coverage</span>
      </Button>
    );
  }

  if (shift.coverageRequest.status === CoverageStatus.open) {
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
          pending={isCancelling}
          onClick={() =>
            cancelCoverageRequest({
              coverageRequestId: shift.coverageRequest!.id,
            })
          }
        >
          <XIcon />
          <span>Withdraw coverage request</span>
        </Button>
      </ConfirmDialog>
    );
  }

  // Nothing to show
  return null;
}
