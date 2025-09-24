import { z } from "zod";

export const CreateCoverageRequestInput = z.object({
  shiftId: z.uuid(),
});

export const CoverageRequestIdInput = z.object({
  coverageRequestId: z.uuid(),
});
