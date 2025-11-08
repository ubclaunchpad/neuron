import type { ListRequest } from "@/models/api/common";
import type { ListResponse } from "@/models/list-response";
import { buildVolunteer, type Volunteer } from "@/models/volunteer";
import { type Drizzle } from "@/server/db";
import { getViewColumns } from "@/server/db/extensions/get-view-columns";
import { NeuronError, NeuronErrorCodes } from "@/server/errors/neuron-error";
import { inArray, sql } from "drizzle-orm";
import { volunteerUserView, user } from "../../db/schema/user";
import { Status } from "@/models/interfaces";
import { coursePreference } from "@/server/db/schema/user";
import { and, eq } from "drizzle-orm";
import { course } from "@/server/db/schema";


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


  async setClassPreference(volunteerUserId: string, classId: string, preferred: boolean): Promise<void> {
    const existing = await this.db
    .select()
    .from(coursePreference)
    .where(and(
      eq(coursePreference.volunteerUserId, volunteerUserId), 
      eq(coursePreference.courseId, classId)));
    
    const alreadyPreferred = existing.length > 0;

    if (preferred && alreadyPreferred) {
      throw new NeuronError(`Course ${classId} already starred by volunteer ${volunteerUserId}`, NeuronErrorCodes.BAD_REQUEST);
    }

    if (!preferred && !alreadyPreferred) {
      throw new NeuronError(`Course ${classId} not starred by volunteer ${volunteerUserId}`, NeuronErrorCodes.BAD_REQUEST)
    }

    if (preferred) {
      await this.db.insert(coursePreference).values({volunteerUserId, courseId: classId});
    } else {
      await this.db
      .delete(coursePreference)
      .where(and(
        eq(coursePreference.volunteerUserId, volunteerUserId), 
        eq(coursePreference.courseId, classId)));
    }
  }

  async getClassPreference(volunteerUserId: string, classId: string): Promise<{ preferred: boolean}> {   
    const courseExists = await this.db
    .select({ id: course.id })
    .from(course)
    .where(eq(course.id, classId))
    .then(r => r.length > 0);

    if (!courseExists) {
      throw new NeuronError(
        `Course with id ${classId} not found`,
        NeuronErrorCodes.NOT_FOUND
      );
    }
    
    const result = await this.db
      .select()
      .from(coursePreference)
      .where(and(eq(coursePreference.volunteerUserId, volunteerUserId), eq(coursePreference.courseId, classId)));
      
    return {preferred: result.length > 0};
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