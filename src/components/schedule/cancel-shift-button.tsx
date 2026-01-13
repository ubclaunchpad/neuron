"use client";

import { Button } from "@/components/primitives/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ShiftStatus, type SingleShift } from "@/models/shift";
import NiceModal from "@ebay/nice-modal-react";
import { X } from "lucide-react";
import { CancelShiftModal } from "./modals/cancel-shift-modal";

export function CancelShiftButton({
  shift,
  className,
}: {
  shift: SingleShift;
  className?: string;
}) {
  if (
    shift.status === ShiftStatus.inprogress ||
    shift.status === ShiftStatus.finished
  ) {
    return null;
  }

  if (shift.status === ShiftStatus.cancelled) {
    return (
      <Badge
        className={cn(
          "z-10 border-destructive/40 bg-destructive/10 text-destructive",
          className,
        )}
      >
        {ShiftStatus.getName(shift.status)}
      </Badge>
    );
  }

  return (
    <Button
      variant="destructive-outline"
      startIcon={<X aria-hidden />}
      onClick={() => NiceModal.show(CancelShiftModal, { shift })}
    >
      Cancel
    </Button>
  );
}
