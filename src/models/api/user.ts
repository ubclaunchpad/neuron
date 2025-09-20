import { Uuid } from "@/models/api/common";
import { z } from "zod";

export const UserIdInput = z.object({
  userId: Uuid,
});
