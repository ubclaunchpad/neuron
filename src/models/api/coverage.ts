import { Uuid } from "@/models/api/common";
import { z } from "zod";

export const CreateCoverageRequestInput = z.object({
  shiftId: Uuid,
});

export const CoverageRequestIdInput = z.object({
  coverageRequestId: Uuid,
});
