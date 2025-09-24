import { z } from "zod";

export const UserIdInput = z.object({
  userId: z.uuid(),
});
