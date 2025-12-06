import type { ListRequestWithSearch } from "@/models/api/common";
import type { UpdateVolunteerInput } from "@/models/api/volunteer";
import type { ListResponse } from "@/models/list-response";
import { buildVolunteer, type Volunteer } from "@/models/volunteer";
import { type Drizzle } from "@/server/db";
import { getViewColumns } from "@/server/db/extensions/get-view-columns";
import { NeuronError, NeuronErrorCodes } from "@/server/errors/neuron-error";
import { buildSearchCondition, buildSimilarityExpression, getPagination } from "@/utils/searchUtils";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import type { z } from "zod";
import { coursePreference, volunteer, volunteerUserView, user } from "../../db/schema/user";

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


  async setClassPreference(
    volunteerUserId: string,
    classId: string,
    preferred: boolean,
  ): Promise<void> {
    // These are idempotent, no need to error if value is already correct
    if (preferred) {
      await this.db
        .insert(coursePreference)
        .values({ volunteerUserId, courseId: classId })
        .onConflictDoNothing({
          target: [
            coursePreference.volunteerUserId,
            coursePreference.courseId,
          ],
        });
    } else {
      await this.db
        .delete(coursePreference)
        .where(
          and(
            eq(coursePreference.volunteerUserId, volunteerUserId),
            eq(coursePreference.courseId, classId),
          ),
        );
    }
  }

  async getClassPreference(volunteerUserId: string, classId: string): Promise<{ preferred: boolean}> {   
    const result = await this.db
      .select()
      .from(coursePreference)
      .where(
        and(
          eq(coursePreference.volunteerUserId, volunteerUserId), 
          eq(coursePreference.courseId, classId)
        )
      );
      
    return { preferred: result.length > 0 };
  }
  
  async updateVolunteerProfile(
    input: z.infer<typeof UpdateVolunteerInput>,
  ): Promise<void> {
    await this.db.transaction(async (tx) => {
      const { volunteerUserId, ...rest } = input;

      const userUpdate = {
        name: rest.firstName,
        lastName: rest.lastName,
        email: rest.email,
      };

      const volunteerUpdate = {
        preferredName: rest.preferredName,
        bio: rest.bio,
        pronouns: rest.pronouns,
        city: rest.city,
        province: rest.province,
      };

      const [updatedUser] = await tx
        .update(user)
        .set(userUpdate)
        .where(eq(user.id, volunteerUserId))
        .returning({ id: user.id });

      if (!updatedUser) {
        throw new NeuronError(
          `Could not update user record for volunteer id ${volunteerUserId}`,
          NeuronErrorCodes.NOT_FOUND,
        );
      }

      const [updatedVolunteer] = await tx
        .update(volunteer)
        .set(volunteerUpdate)
        .where(eq(volunteer.userId, volunteerUserId))
        .returning({ userId: volunteer.userId });

      if (!updatedVolunteer) {
        throw new NeuronError(
          `Could not find volunteer with id ${volunteerUserId}`,
          NeuronErrorCodes.NOT_FOUND,
        );
      }
    });
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
}
