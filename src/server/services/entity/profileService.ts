import type { ListRequest } from "@/models/api/common";
import type { ListResponse } from "@/models/list-response";
import { type Drizzle } from "@/server/db";
import { getViewColumns } from "@/server/db/extensions/get-view-columns";
import { NeuronError, NeuronErrorCodes } from "@/server/errors/neuron-error";
import { inArray, sql } from "drizzle-orm";
import { user } from "../../db/schema/user";
import { eq } from "drizzle-orm";

export class ProfileService {
  private readonly db: Drizzle;
  constructor(db: Drizzle) {
    this.db = db;
  }

  async getPresignedUrl(fileType: string): Promise<void> {
    // TODO: getPresignedUrl
    // CAll MINIO API
  }

  async updateProfileImage(userId: string, imageUrl: string): Promise<void> {
    await this.db.update(user).set({ image: imageUrl }).where(eq(user.id, userId));
  }
}