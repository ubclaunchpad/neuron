import type { ListRequest } from "@/models/api/common";
import type { ListResponse } from "@/models/list-response";
import { Status } from "@/models/interfaces";
import { buildVolunteer, type Volunteer } from "@/models/volunteer";
import { type Drizzle } from "@/server/db";
import { getViewColumns } from "@/server/db/extensions/get-view-columns";
import { NeuronError, NeuronErrorCodes } from "@/server/errors/neuron-error";
import { eq, desc, inArray, sql } from "drizzle-orm";
import { volunteer, volunteerUserView, user } from "../../db/schema/user";
import type { VolunteerUserViewDB } from "@/server/db/schema";
import { buildSimilarityExpression, buildSearchCondition, getPagination } from "@/utils/searchUtils";

export class VolunteerService {
  private readonly db: Drizzle;
  constructor(db: Drizzle) {
    this.db = db;
  }

  async getVolunteersForRequest(listRequest: ListRequest): Promise<ListResponse<Volunteer>> {
    const { perPage, offset } = getPagination(listRequest);
    const queryInput = listRequest.queryInput?.trim() ?? "";

    const similarity = queryInput.length > 0
      ? buildSimilarityExpression([volunteerUserView.name, volunteerUserView.lastName, volunteerUserView.email], queryInput)
      : undefined;

    const baseSelect = {
      count: sql<number>`count(*) over()`,
      ...getViewColumns(volunteerUserView),
    } as const;

    const selectShape = queryInput.length > 0
      ? { ...baseSelect, similarity: similarity! }
      : baseSelect;

    let builder: any = this.db
      .select(selectShape)
      .from(volunteerUserView);

    if (queryInput.length > 0) {
      builder = builder
        .where(buildSearchCondition([volunteerUserView.name, volunteerUserView.lastName, volunteerUserView.email], queryInput))
        .orderBy(desc(similarity!));
    }

    const rows = await builder
      .limit(perPage)
      .offset(offset) as Array<VolunteerUserViewDB & { count: number; similarity?: number }>;

    return {
      data: rows.map((d) => buildVolunteer(d)),
      total: rows[0]?.count ?? 0,
    };
  }

  async getVolunteers(ids: string[]): Promise<Volunteer[]> {
    const data = await this.db
      .select()
      .from(volunteerUserView)
      .where(inArray(volunteerUserView.id, ids));

    if (data.length !== ids.length) {
      const firstMissing = ids.find((id) => !data.some((d) => d.id === id));
      throw new NeuronError(`Could not find Volunteer with id ${firstMissing}`, NeuronErrorCodes.NOT_FOUND);
    }

    return data.map((d) => buildVolunteer(d));
  }

  async getVolunteer(id: string): Promise<Volunteer> {
    return await this.getVolunteers([id]).then(([volunteer]) => volunteer!);
  }

  async updateVolunteerProfile(input: {
    volunteerUserId: string;
    preferredName?: string;
    bio?: string;
    pronouns?: string;
    phoneNumber?: string;
    city?: string;
    province?: string;
    preferredTimeCommitmentHours?: number;
  }): Promise<void> {
    const { volunteerUserId, ...rest } = input;

    const updateData: Partial<typeof volunteer.$inferInsert> = {};
    if (rest.preferredName !== undefined) {
      updateData.preferredName = rest.preferredName;
    }
    if (rest.bio !== undefined) {
      updateData.bio = rest.bio;
    }
    if (rest.pronouns !== undefined) {
      updateData.pronouns = rest.pronouns;
    }
    if (rest.phoneNumber !== undefined) {
      updateData.phoneNumber = rest.phoneNumber;
    }
    if (rest.city !== undefined) {
      updateData.city = rest.city;
    }
    if (rest.province !== undefined) {
      updateData.province = rest.province;
    }
    if (rest.preferredTimeCommitmentHours !== undefined) {
      updateData.preferredTimeCommitmentHours = rest.preferredTimeCommitmentHours;
    }

    if (Object.keys(updateData).length === 0) {
      throw new NeuronError("No volunteer profile fields provided to update.", NeuronErrorCodes.BAD_REQUEST);
    }

    const [updated] = await this.db
      .update(volunteer)
      .set(updateData)
      .where(eq(volunteer.userId, volunteerUserId))
      .returning({ userId: volunteer.userId });

    if (!updated) {
      throw new NeuronError(`Could not find Volunteer with id ${volunteerUserId}`, NeuronErrorCodes.NOT_FOUND);
    }
  }

  async updateVolunteerAvailability(volunteerUserId: string, availability: string): Promise<void> {
    const [updated] = await this.db
      .update(volunteer)
      .set({ availability })
      .where(eq(volunteer.userId, volunteerUserId))
      .returning({ userId: volunteer.userId });

    if (!updated) {
      throw new NeuronError(`Could not find Volunteer with id ${volunteerUserId}`, NeuronErrorCodes.NOT_FOUND);
    }
  }

  // any -> active
  async verifyVolunteer(id: string): Promise<void> {
    await this.db.update(user).set({ status: Status.active }).where(eq(user.id, id));
  }

  // unverified -> rejected
  async rejectVolunteer(id: string): Promise<void> {
    const currentStatus = await this.db.select().from(user).where(eq(user.id, id)).then(([user]) => user?.status);

    if (currentStatus !== Status.unverified) {
      throw new NeuronError(`Volunteer with id ${id} is already verified. Cannot be rejected.`, NeuronErrorCodes.BAD_REQUEST);
    }
    await this.db.update(user).set({ status: Status.rejected }).where(eq(user.id, id));
  }

  // active -> inactive
  async deactivateVolunteer(id: string): Promise<void> {
    const currentStatus = await this.db.select().from(user).where(eq(user.id, id)).then(([user]) => user?.status);

    if (currentStatus !== Status.active) {
      throw new NeuronError(`Volunteer with id ${id} is not active`, NeuronErrorCodes.BAD_REQUEST);
    }

    await this.db.update(user).set({ status: Status.inactive }).where(eq(user.id, id));
  }
}
