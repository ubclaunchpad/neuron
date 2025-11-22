import type { ListRequestWithSearch } from "@/models/api/common";
import { UpdateVolunteerProfileInput } from "@/models/api/volunteer";
import { Status } from "@/models/interfaces";
import type { ListResponse } from "@/models/list-response";
import { buildVolunteer, type Volunteer } from "@/models/volunteer";
import { type Drizzle } from "@/server/db";
import { getViewColumns } from "@/server/db/extensions/get-view-columns";
import { course } from "@/server/db/schema";
import { NeuronError, NeuronErrorCodes } from "@/server/errors/neuron-error";
import { buildSearchCondition, buildSimilarityExpression, getPagination } from "@/utils/searchUtils";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import type { z } from "zod";
import { coursePreference, user, volunteer, volunteerUserView } from "../../db/schema/user";

export class VolunteerService {
  private readonly db: Drizzle;
  constructor(db: Drizzle) {
    this.db = db;
  }

  async getVolunteersForRequest(listRequest: ListRequestWithSearch): Promise<ListResponse<Volunteer>> {
    const { perPage, offset } = getPagination(listRequest);
    const queryInput = listRequest.search?.trim();
    const hasQuery = !!queryInput

    const similarity = hasQuery
      ? buildSimilarityExpression([volunteerUserView.name, volunteerUserView.lastName, volunteerUserView.email], queryInput)
      : undefined;

    const baseSelect = {
      count: sql<number>`count(*) over()`,
      ...getViewColumns(volunteerUserView),
    } as const;

    const selectShape = hasQuery
      ? { ...baseSelect, similarity: similarity! }
      : baseSelect;

    let builder = this.db
      .select(selectShape)
      .from(volunteerUserView)
      .$dynamic();

    if (hasQuery) {
      builder = builder
        .where(buildSearchCondition([volunteerUserView.name, volunteerUserView.lastName, volunteerUserView.email], queryInput))
        .orderBy(desc(similarity!));
    }

    const rows = await builder
      .limit(perPage)
      .offset(offset)
      .execute();

    const total = rows[0]?.count ?? 0;
    const loadedSoFar = offset + rows.length;
    const nextCursor = loadedSoFar < total ? loadedSoFar : null;
    
    return {
      data: rows.map((d) => buildVolunteer(d)),
      total,
      nextCursor,
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
  
  async updateVolunteerProfile(
    input: z.infer<typeof UpdateVolunteerProfileInput>,
  ): Promise<void> {
    const { volunteerUserId, ...rest } = input;

    const [updated] = await this.db
      .update(volunteer)
      .set(rest)
      .where(eq(volunteer.userId, volunteerUserId))
      .returning({ userId: volunteer.userId });

    if (!updated) {
      throw new NeuronError(
        `Could not find Volunteer with id ${volunteerUserId}`,
        NeuronErrorCodes.NOT_FOUND,
      );
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
