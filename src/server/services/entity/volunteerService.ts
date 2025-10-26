import type { ListRequest } from "@/models/api/common";
import type { ListResponse } from "@/models/list-response";
import { buildVolunteer, type Volunteer } from "@/models/volunteer";
import { type Drizzle } from "@/server/db";
import { getViewColumns } from "@/server/db/extensions/get-view-columns";
import { NeuronError, NeuronErrorCodes } from "@/server/errors/neuron-error";
import { inArray, sql } from "drizzle-orm";
import { volunteerUserView, user } from "../../db/schema/user";
import { Status } from "@/models/interfaces";
import { eq, desc } from "drizzle-orm";

export class VolunteerService {
  private readonly db: Drizzle;
  constructor(db: Drizzle) {
    this.db = db;
  }

  async getVolunteersForRequest(listRequest: ListRequest): Promise<ListResponse<Volunteer>> {
    const { perPage, offset } = this.getPagination(listRequest);
    const queryInput = listRequest.queryInput?.trim() ?? "";

    const similarity = queryInput.length > 0
      ? this.buildSimilarityExpression(queryInput)
      : undefined;

    const baseSelect = {
      count: sql<number>`count(*)`,
      ...getViewColumns(volunteerUserView),
    } as const;

    const builder = queryInput.length > 0
      ? this.db
          .select({ ...baseSelect, similarity: similarity! })
          .from(volunteerUserView)
          .where(this.buildSearchCondition(queryInput))
          .orderBy(desc(similarity!))
      : this.db
          .select(baseSelect)
          .from(volunteerUserView);

    const rows = await builder.limit(perPage).offset(offset);

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

  // HELPER FUNCTIONS
  private getPagination(listRequest: ListRequest) {
    const page = listRequest.page ?? 0;
    const perPage = listRequest.perPage ?? 10;
    const offset = page * perPage;
    return { page, perPage, offset } as const;
  }

  private buildSimilarityExpression(queryInput: string) {
    return sql<number>`((similarity(${volunteerUserView.name}, ${queryInput}) * 3) +
      (similarity(${volunteerUserView.lastName}, ${queryInput}) * 2) +
      (similarity(${volunteerUserView.email}, ${queryInput}) * 1))`;
  }

  private buildSearchCondition(queryInput: string) {
    return sql`(LOWER(${volunteerUserView.name}) % LOWER(${queryInput}) OR
          LOWER(${volunteerUserView.lastName}) % LOWER(${queryInput}) OR
          LOWER(${volunteerUserView.email}) %> LOWER(${queryInput}))`;
  }
}