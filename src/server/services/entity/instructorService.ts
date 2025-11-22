import type { ListRequest } from "@/models/api/common";
import { buildInstructor, type Instructor } from "@/models/instructor";
import type { ListResponse } from "@/models/list-response";
import { type Drizzle } from "@/server/db";
import { getViewColumns } from "@/server/db/extensions/get-view-columns";
import { NeuronError, NeuronErrorCodes } from "@/server/errors/neuron-error";
import { inArray, sql } from "drizzle-orm";
import { instructorUserView } from "../../db/schema/user";
import { user } from "@/server/db/schema/user";
import { eq } from "drizzle-orm";
import { Role, Status } from "@/models/interfaces";

export class InstructorService {
  private readonly db: Drizzle;
  constructor(db: Drizzle) {
    this.db = db;
  }

  async getInstructorsForRequest(listRequest: ListRequest): Promise<ListResponse<Instructor>> {
    const page = listRequest.page ?? 0;
    const perPage = listRequest.perPage ?? 10;
    const offset = page * perPage;

    // Get count and ids
    const data = await this.db
      .select({
        count: sql<number>`count(*)`,
        ...getViewColumns(instructorUserView),
      })
      .from(instructorUserView)
      .limit(perPage)
      .offset(offset);

    return {
      data: data.map((d) => buildInstructor(d)),
      total: data[0]?.count ?? 0,
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