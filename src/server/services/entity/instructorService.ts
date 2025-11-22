import type { ListRequestWithSearch } from "@/models/api/common";
import { buildInstructor, type Instructor } from "@/models/instructor";
import type { ListResponse } from "@/models/list-response";
import { type Drizzle } from "@/server/db";
import { getViewColumns } from "@/server/db/extensions/get-view-columns";
import { NeuronError, NeuronErrorCodes } from "@/server/errors/neuron-error";
import { buildSearchCondition, buildSimilarityExpression, getPagination } from "@/utils/searchUtils";
import { desc, inArray, sql } from "drizzle-orm";
import { instructorUserView } from "../../db/schema/user";
import { user } from "@/server/db/schema/user";
import { eq } from "drizzle-orm";
import { Role, Status } from "@/models/interfaces";

export class InstructorService {
  private readonly db: Drizzle;
  constructor(db: Drizzle) {
    this.db = db;
  }

  async getInstructorsForRequest(listRequest: ListRequestWithSearch): Promise<ListResponse<Instructor>> {
    const { perPage, offset } = getPagination(listRequest);
    const queryInput = listRequest.search?.trim();
    const hasQuery = !!queryInput

    const similarity = hasQuery
      ? buildSimilarityExpression([instructorUserView.name, instructorUserView.lastName, instructorUserView.email], queryInput)
      : undefined;

    const baseSelect = {
      count: sql<number>`count(*) over()`,
      ...getViewColumns(instructorUserView),
    } as const;

    const selectShape = hasQuery
      ? { ...baseSelect, similarity: similarity! }
      : baseSelect;

    let builder = this.db
      .select(selectShape)
      .from(instructorUserView)
      .$dynamic();

    if (hasQuery) {
      builder = builder
        .where(buildSearchCondition([instructorUserView.name, instructorUserView.lastName, instructorUserView.email], queryInput))
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
      data: rows.map((d) => buildInstructor(d)),
      total,
      nextCursor,
    };
  }

  async getInstructors(ids: string[]): Promise<Instructor[]> {
    const data = await this.db
      .select()
      .from(instructorUserView)
      .where(inArray(instructorUserView.id, ids));

    if (data.length !== ids.length) {
      const firstMissing = ids.find((id) => !data.some((d) => d.id === id));
      throw new NeuronError(`Could not find Instructor with id ${firstMissing}`, NeuronErrorCodes.NOT_FOUND);
    }

    return data.map((d) => buildInstructor(d));
  }

  async getInstructor(id: string): Promise<Instructor> {
    return await this.getInstructors([id]).then(([instructor]) => instructor!);
  }

  async inviteInstructor(): Promise<void> {
    
  }

  async createInstructor(firstName: string, lastName: string, email: string): Promise<void> {
    // check for duplicate
    const existing = await this.db.select().from(user).where(eq(user.email, email));
    if (existing.length>0) {
      throw new NeuronError('Instructor with email ${email} already exists.', NeuronErrorCodes.BAD_REQUEST);
    }

    // insert instructor user
    await this.db.insert(user).values({
      name: firstName,
      lastName,
      email,
      role: Role.instructor,
      status: Status.active,
      emailVerified: false,
    })
  }

  async updateInstructor(
    instructorId: string,
    updates: Partial<{ firstName: string; lastName: string; email: string}>
  ): Promise<void> {
    const [updated] = await this.db.update(user).set({
      ...(updates.firstName && { name: updates.firstName }),
      ...(updates.lastName && {lastname: updates.lastName}),
      ...(updates.email && {email: updates.email}),
    })
    .where(eq(user.id, instructorId))
    .returning({id: user.id});

    if(!updated) {
      throw new NeuronError('Instructor with id ${instructorId} not found.', NeuronErrorCodes.NOT_FOUND);
    }
  }

  async deleteInstructor(instructorId: string): Promise<void> {
    const [deleted] = await this.db
    .delete(user)
    .where(eq(user.id, instructorId))
    .returning({ id: user.id });

    if(!deleted) {
      throw new NeuronError('Instructor with id ${instructorId} not found.', NeuronErrorCodes.NOT_FOUND);
    }
  }
}