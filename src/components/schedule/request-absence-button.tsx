"use client";

import { Button } from "@/components/primitives/button";
import type { ListShift } from "@/models/shift";
import NiceModal from "@ebay/nice-modal-react";
import { RequestCoverageModal } from "./modals/request-coverage-modal";

export function RequestCoverageButton({
  shift,
  className,
}: {
  shift: ListShift;
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
