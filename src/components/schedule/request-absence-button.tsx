"use client";

import { Button } from "@/components/primitives/button";
import type { SingleShift } from "@/models/shift";
import NiceModal from "@ebay/nice-modal-react";
import { RequestCoverageModal } from "./modals/request-coverage-modal";

export function RequestCoverageButton({
  shift,
  className,
}: {
  shift: SingleShift;
  className?: string;
}) {
  return (
    <Button
      variant="outline"
      className={className}
      onClick={() => NiceModal.show(RequestCoverageModal, { shift })}
    >
      Request Coverage
    </Button>
  );
}
