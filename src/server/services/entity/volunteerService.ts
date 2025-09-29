import type { ListRequest } from "@/models/api/common";
import type { ListResponse } from "@/models/list-response";
import { buildVolunteer, type Volunteer } from "@/models/volunteer";
import { type Drizzle } from "@/server/db";
import { getViewColumns } from "@/server/db/extensions/get-view-columns";
import { NeuronError, NeuronErrorCodes } from "@/server/errors/neuron-error";
import { inArray, sql } from "drizzle-orm";
import { volunteerUserView, user } from "../../db/schema/user";
import { Status } from "@/models/interfaces";
import { eq } from "drizzle-orm";

export class VolunteerService {
  private readonly db: Drizzle;
  constructor(db: Drizzle) {
    this.db = db;
  }

  async getVolunteersForRequest(listRequest: ListRequest): Promise<ListResponse<Volunteer>> {
    const page = listRequest.page ?? 0;
    const perPage = listRequest.perPage ?? 10;
    const offset = page * perPage;

    // Get count and ids
    const data = await this.db
      .select({
        count: sql<number>`count(*)`,
        ...getViewColumns(volunteerUserView),
      })
      .from(volunteerUserView)
      .limit(perPage)
      .offset(offset);

    return {
      data: data.map((d) => buildVolunteer(d)),
      total: data[0]?.count ?? 0,
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

}