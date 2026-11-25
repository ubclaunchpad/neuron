import { sql } from "drizzle-orm";

import { course, user } from "@/server/db/schema";
import type { RegisteredJob } from "../types";

export const DELETE_IMAGE_JOB_NAME = "jobs.delete-image" as const;

export interface DeleteImagePayload {
  imageKey: string;
}

export const deleteImageJob: RegisteredJob<DeleteImagePayload> = {
  name: DELETE_IMAGE_JOB_NAME,
  retryOpts: {
    retryLimit: 8,
    retryDelay: 60,
    retryBackoff: true,
  },
  handler: async (payload, { cradle }) => {
    const imageKey = payload?.imageKey;
    if (typeof imageKey !== "string" || !imageKey.trim()) {
      return;
    }

    const [ref] = await cradle.db.execute<{ referenced: boolean }>(sql`
      SELECT (
        EXISTS (SELECT 1 FROM ${course} WHERE ${course.image} = ${imageKey})
        OR EXISTS (SELECT 1 FROM ${user} WHERE ${user.image} = ${imageKey})
      ) AS referenced
    `);

    if (ref?.referenced) {
      return;
    }

    await cradle.imageService.deleteImage(imageKey);
  },
};
