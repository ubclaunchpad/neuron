"use client";

import { Button } from "@/components/primitives/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SingleShift } from "@/models/shift";
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
  if (shift.canceled) {
    return (
      <Badge
        className={cn(
          "z-10 border-destructive/40 bg-destructive/10 text-destructive",
          className,
        )}
      >
        Canceled
      </Badge>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className={cn(
        "border-destructive/30 text-destructive hover:bg-destructive/10",
        className,
      )}
      startIcon={<X aria-hidden />}
      onClick={() => NiceModal.show(CancelShiftModal, { shift })}
    >
      Cancel
    </Button>
  );
}
