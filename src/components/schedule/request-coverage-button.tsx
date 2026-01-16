"use client";

import { AlertDialog } from "@/components/primitives/alert-dialog";
import { Button } from "@/components/primitives/button";
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
      <AlertDialog
        alertTitle="Withdraw coverage request?"
        alertDescription="This will close your coverage request for this shift."
        alertActionAsOverride
        alertActionContent={
          <Button size="sm" variant="destructive" pending={isCancelling}>
            Yes, withdraw request
          </Button>
        }
        onAccept={() =>
          cancelCoverageRequest({
            coverageRequestId: shift.coverageRequest!.id,
          })
        }
      >
        <Button
          variant="destructive-outline"
          className={className}
          pending={isCancelling}
        >
          <XIcon />
          <span>Withdraw coverage request</span>
        </Button>
      </AlertDialog>
    );
  }

  // Nothing to show
  return null;
}
